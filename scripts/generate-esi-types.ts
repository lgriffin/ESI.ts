/**
 * ESI Type, Cache TTL & Rate Limit Group Generator
 *
 * Fetches the ESI Swagger 2.0 spec and OpenAPI 3.x meta spec, generates:
 * 1. TypeScript interfaces for all ESI response types
 * 2. A cache TTL map from x-cached-seconds metadata
 * 3. A rate limit group map from x-rate-limit metadata
 *
 * Usage: npx ts-node scripts/generate-esi-types.ts
 *        npm run generate:types
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ESI_SWAGGER_URL = 'https://esi.evetech.net/latest/swagger.json';
const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';
const TYPES_OUTPUT = path.resolve(
  __dirname,
  '../src/types/generated/esi-spec.generated.ts',
);
const TTL_OUTPUT = path.resolve(
  __dirname,
  '../src/core/endpoints/esi-cache-ttls.generated.ts',
);
const RATE_LIMIT_GROUPS_OUTPUT = path.resolve(
  __dirname,
  '../src/core/endpoints/esi-rate-limit-groups.generated.ts',
);
const SCOPES_OUTPUT = path.resolve(
  __dirname,
  '../src/core/endpoints/esi-scopes.generated.ts',
);

interface SwaggerSchema {
  type?: string;
  format?: string;
  description?: string;
  title?: string;
  properties?: Record<string, SwaggerSchema>;
  items?: SwaggerSchema;
  required?: string[];
  enum?: (string | number)[];
  maxItems?: number;
}

interface SwaggerOperation {
  operationId?: string;
  tags?: string[];
  description?: string;
  'x-cached-seconds'?: number;
  parameters?: SwaggerParameter[];
  responses?: Record<
    string,
    {
      description?: string;
      schema?: SwaggerSchema;
      headers?: Record<string, unknown>;
    }
  >;
  security?: Record<string, string[]>[];
}

interface SwaggerParameter {
  name: string;
  in: string;
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
  enum?: string[];
  $ref?: string;
}

interface SwaggerSpec {
  basePath: string;
  host: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, SwaggerOperation>>;
  definitions?: Record<string, SwaggerSchema>;
  parameters?: Record<string, SwaggerParameter>;
  securityDefinitions?: Record<
    string,
    { scopes?: Record<string, string> }
  >;
}

function snakeToPascal(s: string): string {
  return s
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function swaggerTypeToTs(schema: SwaggerSchema, indent: number = 0): string {
  if (schema.enum) {
    return schema.enum.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(' | ');
  }

  if (schema.type === 'array' && schema.items) {
    const itemType = swaggerTypeToTs(schema.items, indent);
    if (itemType.includes('\n') || itemType.includes('{')) {
      return `(${itemType})[]`;
    }
    return `${itemType}[]`;
  }

  if (schema.type === 'object' && schema.properties) {
    return generateInlineObject(schema, indent);
  }

  if (schema.type === 'object') {
    return 'Record<string, unknown>';
  }

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

function generateInlineObject(schema: SwaggerSchema, indent: number): string {
  if (!schema.properties) return 'Record<string, unknown>';

  const pad = '  '.repeat(indent + 1);
  const closePad = '  '.repeat(indent);
  const required = new Set(schema.required ?? []);
  const lines: string[] = ['{'];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const opt = required.has(name) ? '' : '?';
    const tsType = swaggerTypeToTs(prop, indent + 1);
    lines.push(`${pad}${name}${opt}: ${tsType};`);
  }

  lines.push(`${closePad}}`);
  return lines.join('\n');
}

interface GeneratedInterface {
  name: string;
  tag: string;
  operationId: string;
  path: string;
  method: string;
  body: string;
  isArray: boolean;
}

function generateInterface(
  opPath: string,
  method: string,
  op: SwaggerOperation,
): GeneratedInterface | null {
  const response200 = op.responses?.['200'];
  if (!response200?.schema) return null;

  const schema = response200.schema;
  const tag = op.tags?.[0] ?? 'Uncategorized';
  const operationId = op.operationId ?? `${method}_${opPath}`;

  let itemSchema: SwaggerSchema;
  let isArray = false;

  if (schema.type === 'array' && schema.items) {
    itemSchema = schema.items;
    isArray = true;
  } else if (schema.type === 'object' && schema.properties) {
    itemSchema = schema;
  } else {
    return null;
  }

  if (!itemSchema.properties) return null;

  const title = itemSchema.title ?? operationId + '_200_ok';
  const name = snakeToPascal(title);

  const required = new Set(itemSchema.required ?? []);
  const propLines: string[] = [];

  for (const [propName, prop] of Object.entries(itemSchema.properties)) {
    const opt = required.has(propName) ? '' : '?';
    const tsType = swaggerTypeToTs(prop, 1);
    propLines.push(`  ${propName}${opt}: ${tsType};`);
  }

  const body = `export interface ${name} {\n${propLines.join('\n')}\n}`;

  return { name, tag, operationId, path: opPath, method, body, isArray };
}

interface CacheTtlEntry {
  path: string;
  method: string;
  seconds: number;
  operationId: string;
}

function extractCacheTtls(spec: SwaggerSpec): CacheTtlEntry[] {
  const entries: CacheTtlEntry[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as SwaggerOperation | undefined;
      if (!op) continue;

      const seconds = op['x-cached-seconds'];
      if (typeof seconds === 'number' && seconds > 0) {
        entries.push({
          path: routePath.replace(/^\//, '').replace(/\/$/, ''),
          method: method.toUpperCase(),
          seconds,
          operationId: op.operationId ?? '',
        });
      }
    }
  }

  return entries;
}

function writeTypesFile(
  interfaces: GeneratedInterface[],
  specHash: string,
): void {
  const byTag = new Map<string, GeneratedInterface[]>();
  for (const iface of interfaces) {
    const group = byTag.get(iface.tag) ?? [];
    group.push(iface);
    byTag.set(iface.tag, group);
  }

  const lines: string[] = [
    '/* eslint-disable */',
    '// Auto-generated from ESI Swagger spec — do not edit manually',
    `// Spec hash: ${specHash}`,
    `// Total interfaces: ${interfaces.length}`,
    '',
  ];

  const sortedTags = Array.from(byTag.keys()).sort();
  for (const tag of sortedTags) {
    const group = byTag.get(tag)!;
    lines.push(`// --- ${tag} ---`);
    lines.push('');
    for (const iface of group.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(iface.body);
      lines.push('');
    }
  }

  const typeMapEntries = interfaces
    .map((i) => {
      const responseType = i.isArray ? `${i.name}[]` : i.name;
      return `  '${i.operationId}': ${responseType};`;
    })
    .sort();

  lines.push('// Operation ID → Response type mapping');
  lines.push(
    'export interface EsiOperationTypes {',
    ...typeMapEntries,
    '}',
    '',
  );

  fs.mkdirSync(path.dirname(TYPES_OUTPUT), { recursive: true });
  fs.writeFileSync(TYPES_OUTPUT, lines.join('\n'), 'utf-8');
}

function writeTtlFile(entries: CacheTtlEntry[]): void {
  const lines: string[] = [
    '// Auto-generated from ESI Swagger spec — do not edit manually',
    `// Endpoints with cache TTLs: ${entries.length}`,
    '',
    'export const esiCacheTtls: Record<string, number> = {',
  ];

  const sorted = entries.sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of sorted) {
    const key = `${entry.method}:${entry.path}`;
    lines.push(`  '${key}': ${entry.seconds},`);
  }

  lines.push('};');
  lines.push('');

  fs.mkdirSync(path.dirname(TTL_OUTPUT), { recursive: true });
  fs.writeFileSync(TTL_OUTPUT, lines.join('\n'), 'utf-8');
}

// --- OpenAPI 3.x rate limit group extraction ---

interface OpenApiRateLimitExtension {
  group: string;
  'max-tokens'?: number;
  'window-size'?: string;
}

interface OpenApiOperation {
  'x-rate-limit'?: OpenApiRateLimitExtension;
}

interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>;
}

interface RateLimitGroupEntry {
  path: string;
  method: string;
  group: string;
  maxTokens: number;
  windowSizeMs: number;
}

function parseWindowSize(windowSize: string): number {
  const match = windowSize.match(/^(\d+)([smh])$/);
  if (!match || !match[1] || !match[2]) return 900_000;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 900_000;
  }
}

function extractRateLimitGroups(spec: OpenApiSpec): RateLimitGroupEntry[] {
  const entries: RateLimitGroupEntry[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as OpenApiOperation | undefined;
      if (!op) continue;

      const rateLimit = op['x-rate-limit'];
      if (!rateLimit || typeof rateLimit.group !== 'string') continue;

      entries.push({
        path: routePath.replace(/^\//, '').replace(/\/$/, ''),
        method: method.toUpperCase(),
        group: rateLimit.group,
        maxTokens: rateLimit['max-tokens'] ?? 300,
        windowSizeMs: parseWindowSize(rateLimit['window-size'] ?? '15m'),
      });
    }
  }

  return entries;
}

function writeRateLimitGroupsFile(entries: RateLimitGroupEntry[]): void {
  const lines: string[] = [
    '// Auto-generated from ESI OpenAPI spec — do not edit manually',
    `// Endpoints with rate limit groups: ${entries.length}`,
    '',
    'export interface RateLimitGroupSpec {',
    '  group: string;',
    '  maxTokens: number;',
    '  windowSizeMs: number;',
    '}',
    '',
    'export const esiRateLimitGroups: Record<string, RateLimitGroupSpec> = {',
  ];

  const sorted = entries.sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of sorted) {
    const key = `${entry.method}:${entry.path}`;
    lines.push(
      `  '${key}': { group: '${entry.group}', maxTokens: ${entry.maxTokens}, windowSizeMs: ${entry.windowSizeMs} },`,
    );
  }

  lines.push('};');
  lines.push('');

  fs.mkdirSync(path.dirname(RATE_LIMIT_GROUPS_OUTPUT), { recursive: true });
  fs.writeFileSync(RATE_LIMIT_GROUPS_OUTPUT, lines.join('\n'), 'utf-8');
}

// --- ESI scope metadata extraction ---

interface EndpointScopeEntry {
  path: string;
  method: string;
  scopes: string[];
}

function extractAllScopes(spec: SwaggerSpec): string[] {
  const scopes = new Set<string>();
  if (spec.securityDefinitions) {
    for (const def of Object.values(spec.securityDefinitions)) {
      if (def.scopes) {
        for (const scope of Object.keys(def.scopes)) {
          scopes.add(scope);
        }
      }
    }
  }
  return Array.from(scopes).sort();
}

function extractEndpointScopes(spec: SwaggerSpec): EndpointScopeEntry[] {
  const entries: EndpointScopeEntry[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as SwaggerOperation | undefined;
      if (!op?.security?.length) continue;

      const scopes = new Set<string>();
      for (const requirement of op.security) {
        for (const scopeList of Object.values(requirement)) {
          for (const scope of scopeList) {
            scopes.add(scope);
          }
        }
      }

      if (scopes.size > 0) {
        entries.push({
          path: routePath.replace(/^\//, '').replace(/\/$/, ''),
          method: method.toUpperCase(),
          scopes: Array.from(scopes).sort(),
        });
      }
    }
  }

  return entries;
}

function writeScopesFile(
  allScopes: string[],
  entries: EndpointScopeEntry[],
): void {
  const lines: string[] = [
    '// Auto-generated from ESI Swagger spec — do not edit manually',
    `// Total scopes: ${allScopes.length}`,
    `// Endpoints requiring scopes: ${entries.length}`,
    '',
  ];

  lines.push('export type EsiScope =');
  for (let i = 0; i < allScopes.length; i++) {
    const sep = i === allScopes.length - 1 ? ';' : '';
    lines.push(`  | '${allScopes[i]}'${sep}`);
  }
  lines.push('');

  lines.push(
    'export const esiEndpointScopes: Record<string, EsiScope[]> = {',
  );

  const sorted = entries.sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of sorted) {
    const key = `${entry.method}:${entry.path}`;
    const scopeArray = entry.scopes.map((s) => `'${s}'`).join(', ');
    lines.push(`  '${key}': [${scopeArray}],`);
  }

  lines.push('};');
  lines.push('');

  fs.mkdirSync(path.dirname(SCOPES_OUTPUT), { recursive: true });
  fs.writeFileSync(SCOPES_OUTPUT, lines.join('\n'), 'utf-8');
}

async function main(): Promise<void> {
  console.log(`Fetching ESI swagger spec from ${ESI_SWAGGER_URL}...`);

  let spec: SwaggerSpec;
  try {
    const response = await fetch(ESI_SWAGGER_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    spec = (await response.json()) as SwaggerSpec;
  } catch (err) {
    console.error(`Failed to fetch ESI swagger spec: ${err}`);
    process.exit(1);
  }

  const specHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(spec))
    .digest('hex')
    .slice(0, 12);

  console.log(`Spec version: ${spec.info.version}, hash: ${specHash}`);

  // Generate interfaces
  const interfaces: GeneratedInterface[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as SwaggerOperation | undefined;
      if (!op) continue;

      const iface = generateInterface(routePath, method, op);
      if (iface) interfaces.push(iface);
    }
  }

  console.log(`Generated ${interfaces.length} interfaces`);
  writeTypesFile(interfaces, specHash);
  console.log(`Types written to ${TYPES_OUTPUT}`);

  // Generate cache TTLs
  const ttls = extractCacheTtls(spec);
  console.log(`Found ${ttls.length} endpoints with cache TTLs`);
  writeTtlFile(ttls);
  console.log(`Cache TTLs written to ${TTL_OUTPUT}`);

  // Generate rate limit groups from the OpenAPI 3.x meta spec
  console.log(`\nFetching ESI OpenAPI meta spec from ${ESI_OPENAPI_URL}...`);
  let openApiSpec: OpenApiSpec;
  try {
    const oaResponse = await fetch(ESI_OPENAPI_URL);
    if (!oaResponse.ok) {
      throw new Error(`HTTP ${oaResponse.status}: ${oaResponse.statusText}`);
    }
    openApiSpec = (await oaResponse.json()) as OpenApiSpec;
  } catch (err) {
    console.error(`Failed to fetch ESI OpenAPI meta spec: ${err}`);
    console.error('Rate limit groups will not be updated.');
    return;
  }

  const rateLimitGroups = extractRateLimitGroups(openApiSpec);
  console.log(
    `Found ${rateLimitGroups.length} endpoints with rate limit groups`,
  );
  const uniqueGroups = new Set(rateLimitGroups.map((e) => e.group));
  console.log(`Unique groups: ${uniqueGroups.size}`);
  writeRateLimitGroupsFile(rateLimitGroups);
  console.log(`Rate limit groups written to ${RATE_LIMIT_GROUPS_OUTPUT}`);

  // Generate endpoint scope metadata from swagger spec
  const allScopes = extractAllScopes(spec);
  console.log(`\nFound ${allScopes.length} unique ESI scopes`);
  const endpointScopes = extractEndpointScopes(spec);
  console.log(
    `Found ${endpointScopes.length} endpoints requiring OAuth scopes`,
  );
  writeScopesFile(allScopes, endpointScopes);
  console.log(`Scopes written to ${SCOPES_OUTPUT}`);
}

main();
