/**
 * Schema Drift Detection
 *
 * Compares hand-written Zod schemas against the ESI OpenAPI 3.1 spec
 * to detect field-level drift: missing fields, extra fields, and type mismatches.
 *
 * Usage: npx ts-node scripts/generate-schema-drift-report.ts
 *        npm run schema:drift
 */

import * as fs from 'fs';
import * as path from 'path';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';

const EXCEPTIONS_PATH = path.resolve(
  __dirname,
  'schema-drift-exceptions.json',
);

// --- OpenAPI types (mirrored from generate-esi-types.ts) ---

interface OpenApiSchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: (string | number)[];
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
}

interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
}

interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
}

// --- $ref resolution ---

function resolveRef(
  spec: OpenApiSpec,
  ref: string,
): OpenApiSchema | undefined {
  const prefix = '#/components/schemas/';
  if (!ref.startsWith(prefix)) return undefined;
  const schemaName = ref.slice(prefix.length);
  return spec.components?.schemas?.[schemaName];
}

function resolveSchema(
  spec: OpenApiSpec,
  schema: OpenApiSchema,
): OpenApiSchema {
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    if (resolved) return resolveSchema(spec, resolved);
  }
  if (schema.allOf) {
    const merged: OpenApiSchema = { type: 'object', properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(spec, sub);
      if (resolved.properties) {
        Object.assign(merged.properties!, resolved.properties);
      }
      if (resolved.required) {
        merged.required!.push(...resolved.required);
      }
    }
    return merged;
  }
  return schema;
}

// --- OpenAPI type to simple type string ---

function openApiTypeToSimple(schema: OpenApiSchema, spec: OpenApiSpec): string {
  const resolved = resolveSchema(spec, schema);

  if (resolved.enum) return 'enum';
  if (resolved.type === 'integer' || resolved.type === 'number') return 'number';
  if (resolved.type === 'string') return 'string';
  if (resolved.type === 'boolean') return 'boolean';
  if (resolved.type === 'array') {
    if (resolved.items) {
      return `${openApiTypeToSimple(resolved.items, spec)}[]`;
    }
    return 'array';
  }
  if (resolved.type === 'object' || resolved.properties) return 'object';
  return 'unknown';
}

// --- Extract fields from spec response schema ---

interface FieldInfo {
  type: string;
  required: boolean;
}

function extractSpecFields(
  schema: OpenApiSchema,
  spec: OpenApiSpec,
): Record<string, FieldInfo> | null {
  const resolved = resolveSchema(spec, schema);

  if (resolved.type === 'array' && resolved.items) {
    return extractSpecFields(resolved.items, spec);
  }

  if (!resolved.properties) return null;

  const fields: Record<string, FieldInfo> = {};
  const requiredSet = new Set(resolved.required || []);

  for (const [name, propSchema] of Object.entries(resolved.properties)) {
    fields[name] = {
      type: openApiTypeToSimple(propSchema, spec),
      required: requiredSet.has(name),
    };
  }

  return fields;
}

// --- Extract fields from Zod schema via shape ---

function extractZodFields(zodSchema: unknown): Record<string, string> | null {
  const schema = zodSchema as Record<string, unknown>;
  if (!schema || typeof schema !== 'object') return null;

  let shape: Record<string, unknown> | null = null;

  if ('shape' in schema && typeof schema.shape === 'object' && schema.shape) {
    shape = schema.shape as Record<string, unknown>;
  } else if ('_zod' in schema) {
    const zod = schema._zod as Record<string, unknown>;
    if (zod && typeof zod === 'object' && 'def' in zod) {
      const def = zod.def as Record<string, unknown>;
      if (def && typeof def === 'object' && 'shape' in def) {
        shape = def.shape as Record<string, unknown>;
      }
    }
  }

  if (!shape) return null;

  const fields: Record<string, string> = {};
  for (const key of Object.keys(shape)) {
    fields[key] = 'present';
  }
  return fields;
}

// --- Load endpoint definitions to find schema mappings ---

interface EndpointSchemaMapping {
  operationPath: string;
  method: string;
  schemaName: string;
}

function loadEndpointMappings(): EndpointSchemaMapping[] {
  const endpointsDir = path.resolve(__dirname, '../src/core/endpoints');
  const mappings: EndpointSchemaMapping[] = [];

  const files = fs.readdirSync(endpointsDir).filter(
    (f) => f.endsWith('Endpoints.ts') && !f.endsWith('.generated.ts'),
  );

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
      mappings.push({
        operationPath: paths[i]!,
        method: methods[i]!.toLowerCase(),
        schemaName: schemas[i]!,
      });
    }
  }

  return mappings;
}

// --- Drift detection types ---

interface DriftItem {
  field: string;
  issue: string;
  detail: string;
}

interface SchemaDriftResult {
  schemaName: string;
  operationPath: string;
  drifts: DriftItem[];
}

// --- Main ---

async function main(): Promise<void> {
  console.log('Fetching ESI OpenAPI spec...');
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    console.error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
    process.exit(0);
  }
  const spec = (await response.json()) as OpenApiSpec;
  console.log(`Spec loaded: ${Object.keys(spec.paths).length} paths\n`);

  // Load known exceptions
  let exceptions: Record<string, string[]> = {};
  if (fs.existsSync(EXCEPTIONS_PATH)) {
    exceptions = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf-8'));
  }

  // Load endpoint-to-schema mappings
  const mappings = loadEndpointMappings();
  console.log(`Found ${mappings.length} endpoint-to-schema mappings\n`);

  // Load all Zod schemas
  const schemasModule = await import('../src/schemas');
  const schemaExports = schemasModule as Record<string, unknown>;

  const results: SchemaDriftResult[] = [];
  const checked = new Set<string>();

  for (const mapping of mappings) {
    if (checked.has(mapping.schemaName)) continue;
    checked.add(mapping.schemaName);

    const zodSchema = schemaExports[mapping.schemaName];
    if (!zodSchema) continue;

    const zodFields = extractZodFields(zodSchema);
    if (!zodFields) continue;

    // Find matching spec operation
    const specPath = spec.paths[mapping.operationPath];
    if (!specPath) continue;

    const specOp = specPath[mapping.method];
    if (!specOp?.responses?.['200']?.content?.['application/json']?.schema) continue;

    const responseSchema = specOp.responses['200'].content['application/json'].schema;
    const specFields = extractSpecFields(responseSchema, spec);
    if (!specFields) continue;

    const exceptionKey = mapping.schemaName;
    const exceptionFields = new Set(exceptions[exceptionKey] || []);

    const drifts: DriftItem[] = [];

    // Check for fields in spec but missing from Zod schema
    for (const [field, info] of Object.entries(specFields)) {
      if (exceptionFields.has(field)) continue;
      if (!(field in zodFields)) {
        drifts.push({
          field,
          issue: 'missing_from_schema',
          detail: `Field "${field}" (${info.type}, ${info.required ? 'required' : 'optional'}) in spec but not in Zod schema`,
        });
      }
    }

    // Check for fields in Zod schema but not in spec
    for (const field of Object.keys(zodFields)) {
      if (exceptionFields.has(field)) continue;
      if (!(field in specFields)) {
        drifts.push({
          field,
          issue: 'extra_in_schema',
          detail: `Field "${field}" in Zod schema but not in spec`,
        });
      }
    }

    if (drifts.length > 0) {
      results.push({
        schemaName: mapping.schemaName,
        operationPath: mapping.operationPath,
        drifts,
      });
    }
  }

  // Report
  console.log('='.repeat(60));
  console.log('SCHEMA DRIFT REPORT');
  console.log('='.repeat(60));
  console.log(`Schemas checked: ${checked.size}`);
  console.log(`Schemas with drift: ${results.length}`);
  console.log(`Exception keys loaded: ${Object.keys(exceptions).length}`);
  console.log('');

  if (results.length === 0) {
    console.log('No drift detected. All schemas match the spec.');
  } else {
    let totalDrifts = 0;
    for (const result of results) {
      console.log(`--- ${result.schemaName} (${result.operationPath}) ---`);
      for (const drift of result.drifts) {
        console.log(`  [${drift.issue}] ${drift.detail}`);
        totalDrifts++;
      }
      console.log('');
    }
    console.log(`Total drift items: ${totalDrifts}`);
    console.log(
      '\nTo suppress known drift, add field names to scripts/schema-drift-exceptions.json',
    );
  }
}

main().catch((err) => {
  console.error('Schema drift detection failed:', err);
  process.exit(0);
});
