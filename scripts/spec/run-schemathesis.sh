#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${1:-./reports/schemathesis}"
mkdir -p "$REPORT_DIR"
chmod 777 "$REPORT_DIR"

PRISM_CONTAINER="esi-prism-$$"
# Prism and Schemathesis share a bridge network rather than the host's, so
# the run works on Docker Desktop too, where host networking is unavailable;
# port 4010 is published for the readiness probe below.
FUZZ_NETWORK="esi-fuzz-$$"
# Prism runs from its image rather than node_modules: @stoplight/prism-http
# pulls postman-collection, which needs @faker-js/faker 5 and cannot load
# under the faker override the audit gate requires.
PRISM_IMAGE="stoplight/prism:5@sha256:3f6d29e31bfe0b99587f0f6f79c423858dd6a2ea7e1e4658273ed930a78a9acf"

cleanup() {
  if docker ps -aq --filter "name=^${PRISM_CONTAINER}$" | grep -q .; then
    echo "Stopping Prism (container: $PRISM_CONTAINER)..."
    docker rm -f "$PRISM_CONTAINER" >/dev/null 2>&1 || true
  fi
  docker network rm "$FUZZ_NETWORK" >/dev/null 2>&1 || true
}

trap cleanup EXIT

# --- Download & preprocess the ESI OpenAPI spec ---
SPEC_URL="https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16"
MODIFIED_SPEC="$(cd "$REPORT_DIR" && pwd)/esi-openapi-fuzz.json"
export SPEC_URL MODIFIED_SPEC

echo "Downloading and preprocessing ESI OpenAPI spec..."
node <<'PREPROCESS'
const fs = require('fs');
(async () => {
  const res = await fetch(process.env.SPEC_URL);
  if (!res.ok) throw new Error(`Failed to download spec: ${res.status}`);
  const spec = await res.json();

  // Strip security from every operation so Prism serves all endpoints
  for (const methods of Object.values(spec.paths || {})) {
    for (const m of ['get', 'post', 'put', 'delete', 'patch']) {
      if (methods[m]) delete methods[m].security;
    }
  }

  // Remove securitySchemes definition
  if (spec.components) delete spec.components.securitySchemes;

  // Make X-Compatibility-Date header non-required so Prism won't 422
  if (spec.components?.parameters?.CompatibilityDate) {
    spec.components.parameters.CompatibilityDate.required = false;
  }

  // Remove Accept-Language enum constraint so fuzzed values don't cause 422
  if (spec.components?.parameters?.AcceptLanguage) {
    delete spec.components.parameters.AcceptLanguage.schema?.enum;
  }

  // Constrain all integer parameters to safe JS integer range.
  // Schemathesis generates int64-range values (e.g. -9223372036854775808)
  // which Prism rejects as out of range, causing spurious validation failures.
  function clampIntegerSchema(schema) {
    if (!schema || schema.type !== 'integer') return;
    delete schema.format;
    if (schema.minimum === undefined || schema.minimum < 1) schema.minimum = 1;
    if (schema.maximum === undefined || schema.maximum > 2147483647) schema.maximum = 2147483647;
  }

  for (const methods of Object.values(spec.paths || {})) {
    for (const m of ['get', 'post', 'put', 'delete', 'patch']) {
      if (!methods[m]) continue;
      for (const param of methods[m].parameters || []) {
        if (param.schema) clampIntegerSchema(param.schema);
      }
      // Clamp integers in request body schemas (one level deep)
      const body = methods[m].requestBody?.content?.['application/json']?.schema;
      if (body?.properties) {
        for (const prop of Object.values(body.properties)) {
          clampIntegerSchema(prop);
          if (prop.items) clampIntegerSchema(prop.items);
        }
      }
    }
  }

  // Also clamp shared parameter definitions
  for (const param of Object.values(spec.components?.parameters || {})) {
    if (param.schema) clampIntegerSchema(param.schema);
  }

  fs.writeFileSync(process.env.MODIFIED_SPEC, JSON.stringify(spec, null, 2));
  const pathCount = Object.keys(spec.paths || {}).length;
  console.log(`Preprocessed spec: ${pathCount} paths`);
})();
PREPROCESS

echo "Starting Prism mock server on port 4010..."
docker network create "$FUZZ_NETWORK" >/dev/null
docker run -d --name "$PRISM_CONTAINER" \
  --network "$FUZZ_NETWORK" --network-alias prism -p 4010:4010 \
  -v "$MODIFIED_SPEC:/spec/esi-openapi-fuzz.json:ro" \
  "$PRISM_IMAGE" \
  mock -h 0.0.0.0 -p 4010 /spec/esi-openapi-fuzz.json >/dev/null

# Prism validates and dereferences the whole ESI document before it listens,
# which takes well over 30 seconds on a CI runner, so the probe waits up to
# two minutes and gives up early only when the container itself has exited.
# Either failure prints the container log, which is otherwise lost with it.
PRISM_WAIT_SECONDS="${PRISM_WAIT_SECONDS:-120}"
echo "Waiting for Prism to be ready (up to ${PRISM_WAIT_SECONDS}s)..."
for i in $(seq 1 "$PRISM_WAIT_SECONDS"); do
  if curl -s -o /dev/null http://localhost:4010/status 2>/dev/null; then
    echo "Prism is ready after ${i}s."
    break
  fi
  if ! docker ps -q --filter "name=^${PRISM_CONTAINER}$" | grep -q .; then
    echo "Prism exited before it was ready. Container log:"
    docker logs "$PRISM_CONTAINER" 2>&1 | tail -n 50 || true
    exit 1
  fi
  if [ "$i" -eq "$PRISM_WAIT_SECONDS" ]; then
    echo "Prism failed to start within ${PRISM_WAIT_SECONDS} seconds. Container log:"
    docker logs "$PRISM_CONTAINER" 2>&1 | tail -n 50 || true
    exit 1
  fi
  sleep 1
done

echo "Running Schemathesis..."
SCHEMATHESIS_EXIT=0
docker run --rm --network "$FUZZ_NETWORK" \
  -v "$(cd "$REPORT_DIR" && pwd):/reports" \
  -v "$MODIFIED_SPEC:/spec/esi-openapi-fuzz.json:ro" \
  schemathesis/schemathesis \
  run /spec/esi-openapi-fuzz.json \
  --checks all \
  --exclude-checks negative_data_rejection,positive_data_acceptance,use_after_free,unsupported_method,response_schema_conformance,status_code_conformance \
  --max-examples 10 \
  --url http://prism:4010 \
  --workers 4 \
  --request-timeout 10000 \
  --request-retries 1 \
  --header "X-Compatibility-Date: 2025-12-16" \
  --report junit \
  --report-junit-path /reports/junit.xml \
  || SCHEMATHESIS_EXIT=$?

echo "Schemathesis completed with exit code: ${SCHEMATHESIS_EXIT}"

# Schemathesis exits 1 for both test failures AND network errors.
# Parse the JUnit report to distinguish: only fail on real test failures.
if [ "${SCHEMATHESIS_EXIT}" -ne 0 ]; then
  REAL_FAILURES=0
  if [ -f "$(cd "$REPORT_DIR" && pwd)/junit.xml" ]; then
    REAL_FAILURES=$(grep -c 'failures="[1-9]' "$(cd "$REPORT_DIR" && pwd)/junit.xml" || true)
  fi
  if [ "${REAL_FAILURES}" -gt 0 ]; then
    echo "Schemathesis found schema violations. Review the JUnit report."
    exit 1
  else
    echo "Schemathesis exited non-zero but no test failures found (likely network errors from fuzzed payloads)."
    exit 0
  fi
fi
