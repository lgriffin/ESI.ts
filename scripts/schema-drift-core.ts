/**
 * Schema drift comparison: hand-written Zod response schemas against the ESI
 * OpenAPI spec.
 *
 * Pure functions with no I/O, so the unit suite can import them. The CLI in
 * `generate-schema-drift-report.ts` fetches the spec and loads the endpoint
 * definitions.
 */

// --- OpenAPI types (mirrored from generate-esi-types.ts) ---

export interface OpenApiSchema {
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

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
}

export interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
}

// --- $ref resolution ---

function resolveRef(spec: OpenApiSpec, ref: string): OpenApiSchema | undefined {
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
    const merged: OpenApiSchema = {
      type: 'object',
      properties: {},
      required: [],
    };
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
  if (resolved.type === 'integer' || resolved.type === 'number')
    return 'number';
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

// --- Mappings, findings and the report ---

/** One endpoint definition whose response is validated by a Zod schema. */
export interface EndpointSchemaMapping {
  /** Endpoint map and method, e.g. `contractEndpoints.getPublicContractBids`. */
  endpoint: string;
  /** The definition's path template, e.g. `contracts/public/bids/{contractId}`. */
  path: string;
  /** Lower-case HTTP method. */
  method: string;
  /** Name of the exported schema, for messages. */
  schemaName: string;
  /** The Zod schema itself. */
  schema: unknown;
}

export interface DriftFinding {
  endpoint: string;
  schemaName: string;
  specPath: string;
  field: string;
  kind: string;
  detail: string;
}

export interface SchemaDriftReport {
  /** Endpoint definitions with a response schema. */
  mappings: number;
  /** Mappings that resolved to a spec operation. */
  matched: number;
  /** Mappings whose schema was actually compared with a spec response. */
  compared: number;
  /** Mappings that resolved to no spec operation, listed rather than skipped. */
  unmatched: { endpoint: string; path: string; method: string }[];
  findings: DriftFinding[];
}

/** Schema name → field names accepted as deviations. */
export type DriftExceptions = Record<string, string[]>;

export function buildDriftReport(
  spec: OpenApiSpec,
  mappings: EndpointSchemaMapping[],
  exceptions: DriftExceptions = {},
): SchemaDriftReport {
  const findings: DriftFinding[] = [];
  const checked = new Set<string>();
  const unmatched: SchemaDriftReport['unmatched'] = [];
  let matched = 0;
  let compared = 0;

  for (const mapping of mappings) {
    if (checked.has(mapping.schemaName)) continue;
    checked.add(mapping.schemaName);

    const zodFields = extractZodFields(mapping.schema);
    if (!zodFields) continue;

    const specOp = spec.paths[mapping.path]?.[mapping.method];
    if (!specOp) {
      unmatched.push({
        endpoint: mapping.endpoint,
        path: mapping.path,
        method: mapping.method,
      });
      continue;
    }
    matched++;
    const responseSchema =
      specOp.responses?.['200']?.content?.['application/json']?.schema;
    if (!responseSchema) continue;

    const specFields = extractSpecFields(responseSchema, spec);
    if (!specFields) continue;
    compared++;

    const exceptionFields = new Set(exceptions[mapping.schemaName] || []);
    const push = (field: string, kind: string, detail: string) =>
      findings.push({
        endpoint: mapping.endpoint,
        schemaName: mapping.schemaName,
        specPath: mapping.path,
        field,
        kind,
        detail,
      });

    for (const [field, info] of Object.entries(specFields)) {
      if (exceptionFields.has(field)) continue;
      if (!(field in zodFields)) {
        push(
          field,
          'missing_from_schema',
          `Field "${field}" (${info.type}, ${info.required ? 'required' : 'optional'}) in spec but not in Zod schema`,
        );
      }
    }

    for (const field of Object.keys(zodFields)) {
      if (exceptionFields.has(field)) continue;
      if (!(field in specFields)) {
        push(
          field,
          'extra_in_schema',
          `Field "${field}" in Zod schema but not in spec`,
        );
      }
    }
  }

  return {
    mappings: mappings.length,
    matched,
    compared,
    unmatched,
    findings,
  };
}

/** Report mode always exits 0; `--ci` exits 1 when drift was found. */
export function exitCodeFor(
  report: SchemaDriftReport,
  options: { ci: boolean },
): number {
  return options.ci && report.findings.length > 0 ? 1 : 0;
}
