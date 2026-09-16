/**
 * Schema Drift Detection
 *
 * Compares hand-written Zod schemas against the ESI OpenAPI 3.1 spec
 * to detect field-level drift: missing fields, extra fields, and type mismatches.
 *
 * Usage: npx ts-node scripts/generate-schema-drift-report.ts
 *        npx ts-node scripts/generate-schema-drift-report.ts --ci
 *        npm run schema:drift
 *        npm run schema:drift:ci
 */

const ciMode = process.argv.includes('--ci');

import * as fs from 'fs';
import * as path from 'path';
import {
  DriftExceptions,
  EndpointSchemaMapping,
  OpenApiSpec,
  buildDriftReport,
  exitCodeFor,
} from './schema-drift-core';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';

const EXCEPTIONS_PATH = path.resolve(__dirname, 'schema-drift-exceptions.json');

// --- Load endpoint definitions to find schema mappings ---

function loadEndpointMappings(
  schemaExports: Record<string, unknown>,
): EndpointSchemaMapping[] {
  const endpointsDir = path.resolve(__dirname, '../src/core/endpoints');
  const mappings: EndpointSchemaMapping[] = [];

  const files = fs
    .readdirSync(endpointsDir)
    .filter((f) => f.endsWith('Endpoints.ts') && !f.endsWith('.generated.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(endpointsDir, file), 'utf-8');
    const pathRegex = /path:\s*['"`]([^'"`]+)['"`]/g;
    const methodRegex = /method:\s*['"`]([^'"`]+)['"`]/g;
    const schemaRegex = /responseSchema:\s*(?:z\.array\(\s*)?(\w+Schema)/g;

    const paths = [...content.matchAll(pathRegex)].map((m) => m[1]!);
    const methods = [...content.matchAll(methodRegex)].map((m) => m[1]!);
    const schemas = [...content.matchAll(schemaRegex)].map((m) => m[1]!);

    const minLen = Math.min(paths.length, methods.length, schemas.length);
    for (let i = 0; i < minLen; i++) {
      const schema = schemaExports[schemas[i]!];
      if (!schema) continue;
      mappings.push({
        endpoint: `${file.replace(/\.ts$/, '')}[${i}]`,
        path: paths[i]!,
        method: methods[i]!.toLowerCase(),
        schemaName: schemas[i]!,
        schema,
      });
    }
  }

  return mappings;
}

// --- Main ---

async function main(): Promise<void> {
  console.log('Fetching ESI OpenAPI spec...');
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    console.error(
      `Failed to fetch spec: ${response.status} ${response.statusText}`,
    );
    process.exit(ciMode ? 1 : 0);
  }
  const spec = (await response.json()) as OpenApiSpec;
  console.log(`Spec loaded: ${Object.keys(spec.paths).length} paths\n`);

  // Load known exceptions
  let exceptions: DriftExceptions = {};
  if (fs.existsSync(EXCEPTIONS_PATH)) {
    exceptions = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf-8'));
  }

  // Load all Zod schemas and the endpoint-to-schema mappings
  const schemaExports = (await import('../src/schemas')) as Record<
    string,
    unknown
  >;
  const mappings = loadEndpointMappings(schemaExports);
  console.log(`Found ${mappings.length} endpoint-to-schema mappings\n`);

  const report = buildDriftReport(spec, mappings, exceptions);

  console.log('='.repeat(60));
  console.log('SCHEMA DRIFT REPORT');
  console.log('='.repeat(60));
  console.log(`Mappings: ${report.mappings}`);
  console.log(`Matched a spec operation: ${report.matched}`);
  console.log(`Compared: ${report.compared}`);
  console.log(`Drift items: ${report.findings.length}`);
  console.log(`Exception keys loaded: ${Object.keys(exceptions).length}`);
  console.log('');

  if (report.findings.length === 0) {
    console.log('No drift detected. All schemas match the spec.');
  } else {
    for (const finding of report.findings) {
      console.log(
        `  ${finding.schemaName} (${finding.specPath}) [${finding.kind}] ${finding.detail}`,
      );
    }
    console.log(
      '\nTo suppress known drift, add field names to scripts/schema-drift-exceptions.json',
    );
  }

  process.exit(exitCodeFor(report, { ci: ciMode }));
}

main().catch((err) => {
  console.error('Schema drift detection failed:', err);
  process.exit(ciMode ? 1 : 0);
});
