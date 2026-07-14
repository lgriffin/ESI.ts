#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${1:-./reports/schemathesis}"
mkdir -p "$REPORT_DIR"

PRISM_PID=""

cleanup() {
  if [ -n "$PRISM_PID" ]; then
    echo "Stopping Prism (PID: $PRISM_PID)..."
    kill "$PRISM_PID" 2>/dev/null || true
    wait "$PRISM_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Starting Prism mock server on port 4010..."
npx prism mock https://esi.evetech.net/meta/openapi.json -p 4010 &
PRISM_PID=$!

echo "Waiting for Prism to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:4010/ > /dev/null 2>&1; then
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
  schemathesis/schemathesis \
  run http://localhost:4010/openapi.json \
  --checks all \
  --max-examples 50 \
  --url http://localhost:4010 \
  --report /reports/schemathesis-report.tar.gz \
  || SCHEMATHESIS_EXIT=$?

echo "Schemathesis completed with exit code: ${SCHEMATHESIS_EXIT}"
exit "${SCHEMATHESIS_EXIT}"
