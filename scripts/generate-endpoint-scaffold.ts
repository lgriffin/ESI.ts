/**
 * ESI Endpoint Scaffold Generator
 *
 * Fetches the ESI OpenAPI spec and generates endpoint definition boilerplate
 * for all operations. Output is written to etc/endpoint-scaffold.generated.ts
 * as a reference/diff tool — it does NOT overwrite the hand-written endpoint
 * files in src/core/endpoints/.
 *
 * When new ESI endpoints are added, developers can run this script and compare
 * the scaffold against their hand-written definitions to see what's missing.
 *
 * Usage: npx ts-node scripts/generate-endpoint-scaffold.ts
 *        npm run generate:endpoints
 */

import * as fs from 'fs';
import * as path from 'path';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';
const OUTPUT_FILE = path.resolve(
  __dirname,
  '../etc/endpoint-scaffold.generated.ts',
);

// --- OpenAPI types ---

interface OpenApiSchema {
  type?: string;
  $ref?: string;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
}

interface OpenApiParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: { type?: string; format?: string; enum?: string[] };
  $ref?: string;
}

interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  description?: string;
  parameters?: OpenApiParameter[];
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
  security?: Record<string, string[]>[];
}

interface OpenApiSpec {
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    parameters?: Record<string, OpenApiParameter>;
  };
}

// --- Parameter resolution ---

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

// --- Endpoint extraction ---

interface ScaffoldEndpoint {
  tag: string;
  operationId: string;
  path: string;
  method: string;
  requiresAuth: boolean;
  pathParams: string[];
  queryParams: Record<string, string>;
  hasBody: boolean;
  description?: string;
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function extractEndpoints(spec: OpenApiSpec): ScaffoldEndpoint[] {
  const endpoints: ScaffoldEndpoint[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      const op = methods[method] as OpenApiOperation | undefined;
      if (!op) continue;

      const tag = op.tags?.[0] ?? 'Uncategorized';
      const operationId = op.operationId ?? `${method}_${routePath}`;

      // Determine auth requirement
      const requiresAuth =
        Array.isArray(op.security) && op.security.length > 0;

      // Extract parameters
      const pathParams: string[] = [];
      const queryParams: Record<string, string> = {};
      let hasBody = false;

      if (op.parameters) {
        for (const rawParam of op.parameters) {
          const param = resolveParameter(spec, rawParam);
          if (param.in === 'path') {
            pathParams.push(snakeToCamel(param.name));
          } else if (param.in === 'query' && param.name !== 'datasource' && param.name !== 'token' && param.name !== 'page') {
            queryParams[snakeToCamel(param.name)] = param.name;
          }
        }
      }

      // Check for request body (POST/PUT/DELETE with 200 response often have bodies)
      if (method !== 'get') {
        const opRecord = methods[method] as Record<string, unknown>;
        if (opRecord && 'requestBody' in opRecord) {
          hasBody = true;
        }
      }

      // Normalize path: strip leading slash, keep trailing slash if present
      const normalizedPath = routePath.replace(/^\//, '');
      // Convert ESI path params from snake_case to camelCase in path template
      const camelPath = normalizedPath.replace(
        /\{([^}]+)\}/g,
        (_, name: string) => `{${snakeToCamel(name)}}`,
      );

      endpoints.push({
        tag,
        operationId,
        path: camelPath,
        method: method.toUpperCase(),
        requiresAuth,
        pathParams,
        queryParams,
        hasBody,
        description: op.description,
      });
    }
  }

  return endpoints;
}

// --- Output generation ---

function tagToVariableName(tag: string): string {
  // Convert tag like "Faction Warfare" to "factionWarfare"
  const pascal = tag
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generateScaffoldFile(endpoints: ScaffoldEndpoint[], specVersion: string): string {
  const byTag = new Map<string, ScaffoldEndpoint[]>();
  for (const ep of endpoints) {
    const group = byTag.get(ep.tag) ?? [];
    group.push(ep);
    byTag.set(ep.tag, group);
  }

  const lines: string[] = [
    '/* eslint-disable */',
    '// Auto-generated endpoint scaffold from ESI OpenAPI spec — do not edit manually',
    `// Spec version: ${specVersion}`,
    `// Total operations: ${endpoints.length}`,
    '//',
    '// This file is a REFERENCE for comparing against hand-written endpoint',
    '// definitions in src/core/endpoints/. It shows what the OpenAPI spec defines',
    '// for each operation (path, method, auth, params). Hand-written files add',
    '// responseSchema references that cannot be auto-generated.',
    '//',
    '// Usage: npm run generate:endpoints',
    '//        diff this against hand-written files to find missing endpoints',
    '',
    "import { EndpointMap } from '../src/core/endpoints/EndpointDefinition';",
    '',
  ];

  const sortedTags = Array.from(byTag.keys()).sort();
  for (const tag of sortedTags) {
    const group = byTag.get(tag)!;
    const varName = tagToVariableName(tag) + 'EndpointScaffold';

    lines.push(`// --- ${tag} ---`);
    lines.push('');
    lines.push(`export const ${varName} = {`);

    for (const ep of group.sort((a, b) => a.operationId.localeCompare(b.operationId))) {
      // Generate a readable method name from operationId
      const methodName = snakeToCamel(ep.operationId.replace(/^(get|post|put|delete)_/i, ''));

      lines.push(`  // ${ep.operationId}`);
      if (ep.description) {
        const shortDesc = ep.description.split('\n')[0]!.slice(0, 100);
        lines.push(`  // ${shortDesc}`);
      }
      lines.push(`  ${methodName}: {`);
      lines.push(`    path: '${ep.path}',`);
      lines.push(`    method: '${ep.method}',`);
      lines.push(`    requiresAuth: ${ep.requiresAuth},`);

      if (ep.pathParams.length > 0) {
        lines.push(`    pathParams: [${ep.pathParams.map((p) => `'${p}'`).join(', ')}],`);
      }

      if (Object.keys(ep.queryParams).length > 0) {
        const qpEntries = Object.entries(ep.queryParams)
          .map(([key, val]) => `${key}: '${val}'`)
          .join(', ');
        lines.push(`    queryParams: { ${qpEntries} },`);
      }

      if (ep.hasBody) {
        lines.push('    hasBody: true,');
      }

      lines.push('    // responseSchema: TODO — wire hand-written Zod schema');
      lines.push('  },');
    }

    lines.push('} as const satisfies EndpointMap;');
    lines.push('');
  }

  // Generate a summary of coverage gaps
  lines.push('// --- Coverage Summary ---');
  lines.push('//');
  lines.push(`// Total tags: ${sortedTags.length}`);
  lines.push(`// Total operations: ${endpoints.length}`);
  for (const tag of sortedTags) {
    const count = byTag.get(tag)!.length;
    lines.push(`//   ${tag}: ${count} operations`);
  }
  lines.push('');

  return lines.join('\n');
}

// --- Main ---

async function main(): Promise<void> {
  console.log('Fetching ESI OpenAPI spec...');
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    console.error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
    process.exit(1);
  }
  const spec = (await response.json()) as OpenApiSpec;
  console.log(`Spec loaded: ${Object.keys(spec.paths).length} paths`);

  const endpoints = extractEndpoints(spec);
  console.log(`Extracted ${endpoints.length} operations`);

  const output = generateScaffoldFile(endpoints, spec.info.version);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`Scaffold written to ${OUTPUT_FILE}`);

  // Print summary
  const tags = new Set(endpoints.map((e) => e.tag));
  console.log(`\nTags: ${tags.size}`);
  for (const tag of Array.from(tags).sort()) {
    const count = endpoints.filter((e) => e.tag === tag).length;
    console.log(`  ${tag}: ${count} operations`);
  }
}

main().catch((err) => {
  console.error('Endpoint scaffold generation failed:', err);
  process.exit(1);
});
