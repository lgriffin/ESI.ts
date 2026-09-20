/**
 * ESI Open Knowledge Format (OKF) Bundle Generator
 *
 * Fetches the ESI OpenAPI 3.1 spec and generates an OKF v0.2 knowledge bundle
 * cataloging every endpoint as a concept with full operational metadata
 * (auth, scopes, cache TTLs, rate limits, parameters, response schemas).
 *
 * Usage: npx ts-node scripts/generate-okf.ts
 *        npm run generate:okf
 */

import * as fs from 'fs';
import * as path from 'path';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';
const OKF_OUTPUT = path.resolve(__dirname, '../okf');

// --- OpenAPI type definitions (subset needed for OKF generation) ---

interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  title?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: (string | number)[];
  $ref?: string;
}

interface OpenApiRateLimitExtension {
  group: string;
  'max-tokens'?: number;
  'window-size'?: string;
}

interface OpenApiParameter {
  name: string;
  in: string;
  schema?: { type?: string; format?: string; enum?: string[] };
  required?: boolean;
  description?: string;
  $ref?: string;
}

interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  description?: string;
  summary?: string;
  'x-cache-age'?: number;
  'x-rate-limit'?: OpenApiRateLimitExtension;
  parameters?: OpenApiParameter[];
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
  security?: Record<string, string[]>[];
  deprecated?: boolean;
}

interface OpenApiSpec {
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    parameters?: Record<string, OpenApiParameter>;
  };
}

// --- Helpers ---

function resolveRef(spec: OpenApiSpec, ref: string): OpenApiSchema | undefined {
  const prefix = '#/components/schemas/';
  if (!ref.startsWith(prefix)) return undefined;
  return spec.components?.schemas?.[ref.slice(prefix.length)];
}

function resolveSchema(
  spec: OpenApiSpec,
  schema: OpenApiSchema,
): OpenApiSchema {
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    if (resolved) return resolveSchema(spec, resolved);
  }
  return schema;
}

function resolveParameter(
  spec: OpenApiSpec,
  param: OpenApiParameter,
): OpenApiParameter {
  if (param.$ref) {
    const prefix = '#/components/parameters/';
    if (param.$ref.startsWith(prefix)) {
      const name = param.$ref.slice(prefix.length);
      const resolved = spec.components?.parameters?.[name];
      if (resolved) return resolved;
    }
  }
  return param;
}

function kebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function titleCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function operationIdToTitle(opId: string): string {
  // Split PascalCase: "GetMarketsRegionIdOrders" -> "Get Markets Region Id Orders"
  const words = opId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ');
  return words
    .map((w) => {
      const lower = w.toLowerCase();
      if (lower === 'id' || lower === 'ids') return 'ID';
      if (lower === 'fw') return 'FW';
      if (lower === 'ui') return 'UI';
      if (lower === 'npc') return 'NPC';
      if (lower === 'cspa') return 'CSPA';
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function operationIdToSlug(opId: string): string {
  return kebab(opId.replace(/_/g, '-'));
}

function parseWindowSize(windowSize: string): number {
  const match = windowSize.match(/^(\d+)([smh])$/);
  if (!match || !match[1] || !match[2]) return 900_000;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: return 900_000;
  }
}

function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${seconds / 86400}d`;
  if (seconds >= 3600) return `${seconds / 3600}h`;
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

function formatWindowMs(ms: number): string {
  return formatDuration(ms / 1000);
}

function escapeYaml(s: string): string {
  if (/[:#\[\]{}|>&*!?,]/.test(s) || s.includes("'") || s.includes('"')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function schemaTypeLabel(schema: OpenApiSchema, spec: OpenApiSpec): string {
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    if (resolved) return schemaTypeLabel(resolved, spec);
    return 'unknown';
  }
  if (schema.enum) {
    const vals = schema.enum.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    return `enum(${vals.join(', ')})`;
  }
  if (schema.type === 'array' && schema.items) {
    return `${schemaTypeLabel(schema.items, spec)}[]`;
  }
  if (schema.type === 'object' && schema.properties) return 'object';
  if (schema.type === 'integer') return 'integer';
  return schema.type ?? 'unknown';
}

// --- Extracted data structures ---

interface EndpointConcept {
  operationId: string;
  slug: string;
  title: string;
  description: string;
  tag: string;
  tagSlug: string;
  path: string;
  method: string;
  deprecated: boolean;
  requiresAuth: boolean;
  scopes: string[];
  cacheTtl: number | null;
  rateLimit: { group: string; maxTokens: number; windowMs: number } | null;
  parameters: Array<{
    name: string;
    in: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responseSchemaRef: string | null;
  responseSchemaName: string | null;
  responseIsArray: boolean;
  responsePrimitive: string | null;
}

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface EndpointRef {
  slug: string;
  tagSlug: string;
}

interface SchemaConcept {
  refName: string;
  slug: string;
  title: string;
  description: string;
  tag: string;
  fields: SchemaField[];
  usedByEndpoints: EndpointRef[];
}

// --- Extraction ---

function extractEndpoints(spec: OpenApiSpec): EndpointConcept[] {
  const endpoints: EndpointConcept[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as OpenApiOperation | undefined;
      if (!op) continue;

      const operationId = op.operationId ?? `${method}_${routePath.replace(/\//g, '_')}`;
      const tag = op.tags?.[0] ?? 'Uncategorized';
      const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');

      // Auth
      const scopes: string[] = [];
      let requiresAuth = false;
      if (op.security?.length) {
        requiresAuth = true;
        for (const req of op.security) {
          for (const scopeList of Object.values(req)) {
            scopes.push(...scopeList);
          }
        }
      }

      // Cache TTL
      const cacheTtl = typeof op['x-cache-age'] === 'number' ? op['x-cache-age'] : null;

      // Rate limit
      let rateLimit: EndpointConcept['rateLimit'] = null;
      if (op['x-rate-limit']?.group) {
        rateLimit = {
          group: op['x-rate-limit'].group,
          maxTokens: op['x-rate-limit']['max-tokens'] ?? 300,
          windowMs: parseWindowSize(op['x-rate-limit']['window-size'] ?? '15m'),
        };
      }

      // Parameters (filter out headers — they're common across all endpoints)
      const parameters: EndpointConcept['parameters'] = [];
      if (op.parameters) {
        for (const rawParam of op.parameters) {
          const param = resolveParameter(spec, rawParam);
          if (param.in === 'header') continue;
          parameters.push({
            name: param.name,
            in: param.in,
            type: param.schema?.type ?? 'string',
            required: param.required ?? false,
            description: param.description ?? '',
          });
        }
      }

      // Response schema
      let responseSchemaRef: string | null = null;
      let responseSchemaName: string | null = null;
      let responseIsArray = false;
      let responsePrimitive: string | null = null;

      const response200 = op.responses?.['200'];
      if (response200?.content?.['application/json']?.schema) {
        let schema = response200.content['application/json'].schema;
        const prefix = '#/components/schemas/';

        // Resolve top-level $ref, keeping the ref name
        if (schema.$ref) {
          responseSchemaRef = schema.$ref;
          if (schema.$ref.startsWith(prefix)) {
            responseSchemaName = schema.$ref.slice(prefix.length);
          }
          schema = resolveSchema(spec, schema);
        }

        if (schema.type === 'array' && schema.items) {
          responseIsArray = true;
          // If items have their own $ref, prefer that name over the array wrapper
          if (schema.items.$ref) {
            responseSchemaRef = schema.items.$ref;
            if (schema.items.$ref.startsWith(prefix)) {
              responseSchemaName = schema.items.$ref.slice(prefix.length);
            }
          } else if (
            schema.items.type === 'integer' ||
            schema.items.type === 'number' ||
            schema.items.type === 'string'
          ) {
            responsePrimitive = schema.items.type;
            responseSchemaName = null;
            responseSchemaRef = null;
          }
          // else: inline objects in array — keep the array wrapper's $ref name
        }
      }

      endpoints.push({
        operationId,
        slug: operationIdToSlug(operationId),
        title: operationIdToTitle(operationId),
        description: op.summary ?? op.description?.split('\n')[0] ?? '',
        tag,
        tagSlug: kebab(tag),
        path: cleanPath,
        method: method.toUpperCase(),
        deprecated: op.deprecated ?? false,
        requiresAuth,
        scopes: [...new Set(scopes)],
        cacheTtl,
        rateLimit,
        parameters: parameters.filter((p) => p.name !== 'datasource'),
        responseSchemaRef,
        responseSchemaName,
        responseIsArray,
        responsePrimitive,
      });
    }
  }

  return endpoints;
}

function extractSchemas(
  spec: OpenApiSpec,
  endpoints: EndpointConcept[],
): SchemaConcept[] {
  const schemaRefs = new Map<string, { name: string; endpoints: EndpointRef[] }>();

  for (const ep of endpoints) {
    if (ep.responseSchemaName) {
      const existing = schemaRefs.get(ep.responseSchemaName);
      const ref: EndpointRef = { slug: ep.slug, tagSlug: ep.tagSlug };
      if (existing) {
        existing.endpoints.push(ref);
      } else {
        schemaRefs.set(ep.responseSchemaName, {
          name: ep.responseSchemaName,
          endpoints: [ref],
        });
      }
    }
  }

  const schemas: SchemaConcept[] = [];

  for (const [refName, info] of schemaRefs) {
    const raw = spec.components?.schemas?.[refName];
    if (!raw) continue;

    let schema = resolveSchema(spec, raw);

    // Unwrap array schemas to get the item object
    if (schema.type === 'array' && schema.items) {
      schema = resolveSchema(spec, schema.items);
    }

    if (!schema.properties) continue;

    const required = new Set(schema.required ?? []);
    const fields: SchemaField[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const resolved = resolveSchema(spec, fieldSchema);
      fields.push({
        name: fieldName,
        type: schemaTypeLabel(resolved, spec),
        required: required.has(fieldName),
        description: resolved.description ?? '',
      });
    }

    const tag = endpoints.find((e) => e.responseSchemaName === refName)?.tag ?? 'Uncategorized';

    schemas.push({
      refName,
      slug: kebab(refName),
      title: titleCase(refName),
      description: schema.description ?? schema.title ?? `${titleCase(refName)} response object`,
      tag,
      fields,
      usedByEndpoints: info.endpoints,
    });
  }

  return schemas;
}

// --- OKF Markdown Generation ---

function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function generateBundleIndex(
  tags: string[],
  endpointCount: number,
  schemaCount: number,
): string {
  const lines = [
    '---',
    'okf_version: "0.2"',
    '---',
    '',
    '# EVE Online ESI API Knowledge Bundle',
    '',
    `This bundle catalogs **${endpointCount} endpoints** and **${schemaCount} response schemas** from the EVE Swagger Interface (ESI), the official API for EVE Online.`,
    '',
    '## Domains',
    '',
  ];

  for (const tag of tags.sort()) {
    lines.push(`* [${titleCase(tag)}](domains/${kebab(tag)}/index.md) - ${titleCase(tag)} API endpoints`);
  }

  lines.push('');
  lines.push('## Response Schemas');
  lines.push('');
  lines.push('* [All Schemas](schemas/index.md) - Response data models used by ESI endpoints');
  lines.push('');

  return lines.join('\n');
}

function generateLog(
  endpointCount: number,
  schemaCount: number,
  specVersion: string,
): string {
  const date = new Date().toISOString().split('T')[0];
  return [
    '# Bundle Update Log',
    '',
    `## ${date}`,
    '',
    `* **Generation**: Generated OKF bundle from ESI OpenAPI spec v${specVersion}`,
    `* **Coverage**: ${endpointCount} endpoint concepts, ${schemaCount} schema concepts`,
    `* **Generator**: \`scripts/generate-okf.ts\``,
    '',
  ].join('\n');
}

function generateDomainIndex(
  tag: string,
  endpoints: EndpointConcept[],
): string {
  const lines = [
    `# ${titleCase(tag)}`,
    '',
    `${titleCase(tag)} API endpoints.`,
    '',
    '## Endpoints',
    '',
  ];

  const sorted = endpoints.sort((a, b) => a.slug.localeCompare(b.slug));
  for (const ep of sorted) {
    const authBadge = ep.requiresAuth ? ' (auth)' : '';
    lines.push(`* [${ep.title}](${ep.slug}.md) - \`${ep.method} /${ep.path}\`${authBadge}`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateDomainsIndex(tags: string[]): string {
  const lines = [
    '# API Domains',
    '',
    'ESI endpoints organized by domain.',
    '',
  ];

  for (const tag of tags.sort()) {
    lines.push(`* [${titleCase(tag)}](${kebab(tag)}/index.md)`);
  }

  lines.push('');
  return lines.join('\n');
}

function generateEndpointConcept(
  ep: EndpointConcept,
  timestamp: string,
): string {
  const tags: string[] = [ep.tagSlug];
  if (!ep.requiresAuth) tags.push('public');
  if (ep.requiresAuth) tags.push('authenticated');
  if (ep.deprecated) tags.push('deprecated');
  const hasPagination = ep.parameters.some((p) => p.name === 'page');
  if (hasPagination) tags.push('paginated');

  const lines = [
    '---',
    'type: ESI Endpoint',
    `title: ${escapeYaml(ep.title)}`,
    `description: ${escapeYaml(ep.description || `${ep.method} /${ep.path}`)}`,
    `resource: "https://esi.evetech.net/ui/#/${encodeURIComponent(ep.tag)}/${ep.operationId}"`,
    `tags: [${tags.join(', ')}]`,
    'generated:',
    '  by: process:generate-okf',
    `  at: ${timestamp}`,
    `status: ${ep.deprecated ? 'deprecated' : 'stable'}`,
    'sources:',
    '  - id: esi-openapi',
    '    resource: "https://esi.evetech.net/meta/openapi.json"',
    '    title: ESI OpenAPI Specification',
    '---',
    '',
    '# Endpoint',
    '',
    '| Property | Value |',
    '|----------|-------|',
    `| Path | \`${ep.method} /${ep.path}\` |`,
    `| Authentication | ${ep.requiresAuth ? 'Required' : 'None'} |`,
  ];

  if (ep.cacheTtl !== null) {
    lines.push(`| Cache TTL | ${ep.cacheTtl}s (${formatDuration(ep.cacheTtl)}) |`);
  }

  if (ep.rateLimit) {
    lines.push(
      `| Rate Limit Group | ${ep.rateLimit.group} |`,
      `| Rate Limit | ${ep.rateLimit.maxTokens} tokens / ${formatWindowMs(ep.rateLimit.windowMs)} |`,
    );
  }

  if (ep.scopes.length > 0) {
    lines.push('', '# Scopes', '', 'Required OAuth2 scopes:', '');
    for (const scope of ep.scopes) {
      lines.push(`- \`${scope}\``);
    }
  }

  const paramsByLocation = new Map<string, typeof ep.parameters>();
  for (const p of ep.parameters) {
    const group = paramsByLocation.get(p.in) ?? [];
    group.push(p);
    paramsByLocation.set(p.in, group);
  }

  if (ep.parameters.length > 0) {
    lines.push('', '# Parameters', '');
    lines.push('| Name | In | Type | Required | Description |');
    lines.push('|------|-----|------|----------|-------------|');
    for (const p of ep.parameters) {
      lines.push(`| ${p.name} | ${p.in} | ${p.type} | ${p.required ? 'yes' : 'no'} | ${p.description} |`);
    }
  }

  lines.push('', '# Response', '');

  if (ep.responseSchemaName) {
    const schemaSlug = kebab(ep.responseSchemaName);
    const schemaLink = `[${titleCase(ep.responseSchemaName)}](/schemas/${schemaSlug}.md)`;
    if (ep.responseIsArray) {
      lines.push(`Returns an array of ${schemaLink} objects.`);
    } else {
      lines.push(`Returns a ${schemaLink} object.`);
    }
  } else if (ep.responsePrimitive) {
    lines.push(`Returns an array of \`${ep.responsePrimitive}\` values.`);
  } else {
    lines.push('No structured response body.');
  }

  lines.push('');
  return lines.join('\n');
}

function generateSchemaConcept(
  schema: SchemaConcept,
  timestamp: string,
): string {
  const lines = [
    '---',
    'type: ESI Response Schema',
    `title: ${escapeYaml(schema.title)}`,
    `description: ${escapeYaml(schema.description)}`,
    `tags: [${kebab(schema.tag)}, schema]`,
    'generated:',
    '  by: process:generate-okf',
    `  at: ${timestamp}`,
    'status: stable',
    'sources:',
    '  - id: esi-openapi',
    '    resource: "https://esi.evetech.net/meta/openapi.json"',
    '    title: ESI OpenAPI Specification',
    '---',
    '',
    '# Schema',
    '',
    '| Field | Type | Required | Description |',
    '|-------|------|----------|-------------|',
  ];

  for (const field of schema.fields) {
    lines.push(
      `| ${field.name} | ${field.type} | ${field.required ? 'yes' : 'no'} | ${field.description} |`,
    );
  }

  if (schema.usedByEndpoints.length > 0) {
    lines.push('', '# Used By', '');
    for (const ep of schema.usedByEndpoints) {
      lines.push(`- [${ep.slug}](/domains/${ep.tagSlug}/${ep.slug}.md)`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function generateSchemasIndex(schemas: SchemaConcept[]): string {
  const lines = [
    '# Response Schemas',
    '',
    'Data models returned by ESI API endpoints.',
    '',
  ];

  const byTag = new Map<string, SchemaConcept[]>();
  for (const s of schemas) {
    const group = byTag.get(s.tag) ?? [];
    group.push(s);
    byTag.set(s.tag, group);
  }

  for (const [tag, group] of Array.from(byTag.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${titleCase(tag)}`, '');
    for (const s of group.sort((a, b) => a.slug.localeCompare(b.slug))) {
      lines.push(`* [${s.title}](${s.slug}.md) - ${s.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --- File writing ---

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

// --- Main ---

async function main(): Promise<void> {
  console.log(`Fetching ESI OpenAPI spec from ${ESI_OPENAPI_URL}...`);

  let spec: OpenApiSpec;
  try {
    const response = await fetch(ESI_OPENAPI_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    spec = (await response.json()) as OpenApiSpec;
  } catch (err) {
    console.error(`Failed to fetch ESI OpenAPI spec: ${err}`);
    process.exit(1);
  }

  console.log(`Spec version: ${spec.info.version}`);

  // Extract data
  const endpoints = extractEndpoints(spec);
  console.log(`Extracted ${endpoints.length} endpoints`);

  const schemas = extractSchemas(spec, endpoints);
  console.log(`Extracted ${schemas.length} response schemas`);

  const tags = [...new Set(endpoints.map((e) => e.tag))];
  console.log(`Found ${tags.length} domains: ${tags.sort().join(', ')}`);

  const timestamp = generateTimestamp();

  // Clean output directory
  if (fs.existsSync(OKF_OUTPUT)) {
    fs.rmSync(OKF_OUTPUT, { recursive: true });
  }

  // Bundle root
  writeFile(
    path.join(OKF_OUTPUT, 'index.md'),
    generateBundleIndex(tags, endpoints.length, schemas.length),
  );
  writeFile(
    path.join(OKF_OUTPUT, 'log.md'),
    generateLog(endpoints.length, schemas.length, spec.info.version),
  );

  // Domains index
  writeFile(
    path.join(OKF_OUTPUT, 'domains', 'index.md'),
    generateDomainsIndex(tags),
  );

  // Per-domain directories + endpoint concepts
  const byTag = new Map<string, EndpointConcept[]>();
  for (const ep of endpoints) {
    const group = byTag.get(ep.tag) ?? [];
    group.push(ep);
    byTag.set(ep.tag, group);
  }

  let endpointFiles = 0;
  for (const [tag, eps] of byTag) {
    const tagDir = path.join(OKF_OUTPUT, 'domains', kebab(tag));

    writeFile(
      path.join(tagDir, 'index.md'),
      generateDomainIndex(tag, eps),
    );

    for (const ep of eps) {
      writeFile(
        path.join(tagDir, `${ep.slug}.md`),
        generateEndpointConcept(ep, timestamp),
      );
      endpointFiles++;
    }
  }

  // Schemas
  writeFile(
    path.join(OKF_OUTPUT, 'schemas', 'index.md'),
    generateSchemasIndex(schemas),
  );

  let schemaFiles = 0;
  for (const schema of schemas) {
    writeFile(
      path.join(OKF_OUTPUT, 'schemas', `${schema.slug}.md`),
      generateSchemaConcept(schema, timestamp),
    );
    schemaFiles++;
  }

  console.log(`\nOKF bundle written to ${OKF_OUTPUT}/`);
  console.log(`  ${endpointFiles} endpoint concepts`);
  console.log(`  ${schemaFiles} schema concepts`);
  console.log(`  ${tags.length} domain indexes`);
  console.log(`  ${endpointFiles + schemaFiles + tags.length + 3} total files`);
}

main();
