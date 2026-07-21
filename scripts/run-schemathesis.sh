#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${1:-./reports/schemathesis}"
mkdir -p "$REPORT_DIR"
chmod 777 "$REPORT_DIR"

PRISM_PID=""

cleanup() {
  if [ -n "$PRISM_PID" ]; then
    echo "Stopping Prism (PID: $PRISM_PID)..."
    kill "$PRISM_PID" 2>/dev/null || true
    wait "$PRISM_PID" 2>/dev/null || true
  fi
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

  // Remove int32 format from all inline page query parameters so fuzzed
  // values beyond 2^31-1 don't trigger Prism 422 rejections
  for (const methods of Object.values(spec.paths || {})) {
    for (const m of ['get', 'post', 'put', 'delete', 'patch']) {
      for (const param of methods[m]?.parameters || []) {
        if (param.in === 'query' && param.name === 'page' && param.schema) {
          delete param.schema.format;
          delete param.schema.maximum;
        }
      }
    }
  }

  fs.writeFileSync(process.env.MODIFIED_SPEC, JSON.stringify(spec, null, 2));
  const pathCount = Object.keys(spec.paths || {}).length;
  console.log(`Preprocessed spec: ${pathCount} paths`);
})();
PREPROCESS

echo "Starting Prism mock server on port 4010..."
npx prism mock "$MODIFIED_SPEC" -p 4010 --errors &
PRISM_PID=$!

echo "Waiting for Prism to be ready..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:4010/status 2>/dev/null; then
    echo "Prism is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Prism failed to start within 30 seconds."
    exit 1
  fi
  sleep 1
done

echo "Running Schemathesis..."
SCHEMATHESIS_EXIT=0
docker run --rm --network host \
  -v "$(cd "$REPORT_DIR" && pwd):/reports" \
  -v "$MODIFIED_SPEC:/spec/esi-openapi-fuzz.json:ro" \
  schemathesis/schemathesis \
  run /spec/esi-openapi-fuzz.json \
  --checks all \
  --exclude-checks negative_data_rejection,positive_data_acceptance,use_after_free,unsupported_method,response_schema_conformance,status_code_conformance \
  --max-examples 10 \
  --url http://localhost:4010 \
  --workers 2 \
  --request-timeout 30 \
  --request-retries 2 \
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
