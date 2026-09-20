import * as fs from 'fs';
import * as path from 'path';
import { EndpointDefinition } from '../../src/core/endpoints/EndpointDefinition';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';

const ENDPOINTS_DIR = path.resolve(__dirname, '../../src/core/endpoints');

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: { type?: string; enum?: string[] };
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: unknown }>;
  };
  responses?: Record<
    string,
    {
      headers?: Record<string, unknown>;
      content?: Record<string, { schema?: unknown }>;
    }
  >;
  security?: Array<Record<string, string[]>>;
  'x-cache-age'?: number;
}

export interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

export interface EndpointEntry {
  name: string;
  definition: EndpointDefinition;
  file: string;
}

let cachedSpec: OpenApiSpec | null = null;

export async function fetchSpec(): Promise<OpenApiSpec> {
  if (cachedSpec) return cachedSpec;
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ESI spec: HTTP ${response.status}`);
  }
  cachedSpec = (await response.json()) as OpenApiSpec;
  return cachedSpec;
}

export function loadAllEndpoints(): EndpointEntry[] {
  const entries: EndpointEntry[] = [];
  const files = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter((f) => f.endsWith('Endpoints.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(ENDPOINTS_DIR, file), 'utf-8');
    const blocks = extractEndpointBlocks(content);

    for (const { name, body } of blocks) {
      const def = parseEndpointBody(body);
      if (def) {
        entries.push({ name, definition: def, file });
      }
    }
  }

  return entries;
}

function extractEndpointBlocks(
  content: string,
): { name: string; body: string }[] {
  const results: { name: string; body: string }[] = [];
  const namePattern = /(\w+):\s*\{/g;
  let nameMatch;

  while ((nameMatch = namePattern.exec(content)) !== null) {
    const name = nameMatch[1]!;
    const startBrace = nameMatch.index + nameMatch[0].length - 1;

    let depth = 1;
    let i = startBrace + 1;
    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === "'" || ch === '"' || ch === '`') {
        i++;
        while (i < content.length && content[i] !== ch) {
          if (content[i] === '\\') i++;
          i++;
        }
      }
      i++;
    }

    if (depth === 0) {
      const body = content.slice(startBrace + 1, i - 1);
      results.push({ name, body });
    }
  }

  return results;
}

function parseEndpointBody(body: string): EndpointDefinition | null {
  const pathMatch = body.match(/path:\s*'([^']+)'/);
  const methodMatch = body.match(/method:\s*'(GET|POST|PUT|DELETE)'/);
  const authMatch = body.match(/requiresAuth:\s*(true|false)/);

  if (!pathMatch || !methodMatch || !authMatch) return null;

  const pathParamsMatch = body.match(/pathParams:\s*\[([^\]]*)\]/);
  const queryParamsMatch = body.match(/queryParams:\s*\{([^}]*)\}/);
  const hasBodyMatch = body.match(/hasBody:\s*(true|false)/);
  const bodyBuilderMatch = body.match(/bodyBuilder:/);
  const cursorPaginationMatch = body.match(/cursorPagination:\s*(true|false)/);
  const deprecatedMatch = body.match(/deprecated:\s*\{/);
  const responseSchemaMatch = body.match(/responseSchema:/);

  const pathParams = pathParamsMatch
    ? pathParamsMatch[1]!
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter((s) => s.length > 0)
    : undefined;

  const queryParams: Record<string, string> = {};
  if (queryParamsMatch) {
    const qpBody = queryParamsMatch[1]!;
    const qpRegex = /(\w+):\s*'([^']+)'/g;
    let qpMatch;
    while ((qpMatch = qpRegex.exec(qpBody)) !== null) {
      queryParams[qpMatch[1]!] = qpMatch[2]!;
    }
  }

  return {
    path: pathMatch[1]!,
    method: methodMatch[1]! as 'GET' | 'POST' | 'PUT' | 'DELETE',
    requiresAuth: authMatch[1] === 'true',
    pathParams: pathParams && pathParams.length > 0 ? pathParams : undefined,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    hasBody: hasBodyMatch ? hasBodyMatch[1] === 'true' : undefined,
    bodyBuilder: bodyBuilderMatch ? () => ({}) : undefined,
    cursorPagination: cursorPaginationMatch
      ? cursorPaginationMatch[1] === 'true'
      : undefined,
    deprecated: deprecatedMatch ? { message: 'deprecated' } : undefined,
    responseSchema: responseSchemaMatch ? ({} as any) : undefined,
  };
}

export function findSpecOperation(
  spec: OpenApiSpec,
  endpointPath: string,
  method: string,
): OpenApiOperation | null {
  const normalizedEndpoint = '/' + endpointPath.replace(/\/$/, '');

  for (const [specPath, methods] of Object.entries(spec.paths)) {
    const normalizedSpec = specPath.replace(/\/$/, '');

    if (normalizePath(normalizedEndpoint) === normalizePath(normalizedSpec)) {
      const op = methods[method.toLowerCase()];
      if (op) return op;
    }
  }

  return null;
}

function normalizePath(p: string): string {
  return p
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{param}')
    .toLowerCase();
}

export function getSpecPathParams(
  spec: OpenApiSpec,
  specPath: string,
  operation: OpenApiOperation,
): OpenApiParameter[] {
  const pathLevelParams = (spec.paths[specPath] as any)?.parameters ?? [];
  const opLevelParams = operation.parameters ?? [];
  const allParams = [...pathLevelParams, ...opLevelParams];
  return allParams.filter((p: OpenApiParameter) => p.in === 'path');
}

export function getSpecQueryParams(
  spec: OpenApiSpec,
  specPath: string,
  operation: OpenApiOperation,
): OpenApiParameter[] {
  const pathLevelParams = (spec.paths[specPath] as any)?.parameters ?? [];
  const opLevelParams = operation.parameters ?? [];
  const allParams = [...pathLevelParams, ...opLevelParams];
  return allParams.filter((p: OpenApiParameter) => p.in === 'query');
}

export function findSpecPath(
  spec: OpenApiSpec,
  endpointPath: string,
): string | null {
  const normalizedEndpoint = '/' + endpointPath.replace(/\/$/, '');

  for (const specPath of Object.keys(spec.paths)) {
    const normalizedSpec = specPath.replace(/\/$/, '');
    if (normalizePath(normalizedEndpoint) === normalizePath(normalizedSpec)) {
      return specPath;
    }
  }

  return null;
}
