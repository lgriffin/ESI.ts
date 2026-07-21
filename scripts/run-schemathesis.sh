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

  fs.writeFileSync(process.env.MODIFIED_SPEC, JSON.stringify(spec, null, 2));
  console.log(`Preprocessed spec: ${Object.keys(spec.paths).length} paths`);
})();
PREPROCESS

echo "Starting Prism mock server on port 4010..."
npx prism mock "$MODIFIED_SPEC" -p 4010 &
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
  --exclude-checks negative_data_rejection,positive_data_acceptance,use_after_free,unsupported_method \
  --max-examples 10 \
  --url http://localhost:4010 \
  --workers auto \
  --header "X-Compatibility-Date: 2025-12-16" \
  --report junit \
  --report-junit-path /reports/junit.xml \
  || SCHEMATHESIS_EXIT=$?

echo "Schemathesis completed with exit code: ${SCHEMATHESIS_EXIT}"
if [ "${SCHEMATHESIS_EXIT}" -ne 0 ]; then
  echo "Schemathesis found schema violations. Review the JUnit report."
fi
exit "${SCHEMATHESIS_EXIT}"
