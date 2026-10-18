import * as fs from 'fs';
import * as path from 'path';
import { COMPATIBILITY_DATE } from '../../src/core/constants';
import { EndpointDefinition } from '../../src/core/endpoints/EndpointDefinition';

const ESI_OPENAPI_URL = `https://esi.evetech.net/meta/openapi.json?compatibility_date=${COMPATIBILITY_DATE}`;

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

/**
 * Every definition in the endpoint maps, loaded as the modules build them:
 * definitions made with `fromOperation` carry no `path:` text to parse.
 */
export function loadAllEndpoints(): EndpointEntry[] {
  const entries: EndpointEntry[] = [];
  for (const file of fs.readdirSync(ENDPOINTS_DIR).sort()) {
    if (!file.endsWith('Endpoints.ts')) continue;
    const mod = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      Record<string, EndpointDefinition>
    >;
    for (const map of Object.values(mod)) {
      for (const [name, definition] of Object.entries(map)) {
        entries.push({ name, definition, file });
      }
    }
  }
  return entries;
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
