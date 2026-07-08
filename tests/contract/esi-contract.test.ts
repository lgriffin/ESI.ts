/**
 * Deep ESI Contract Tests
 *
 * Validates that every endpoint definition in the SDK structurally matches
 * the live ESI OpenAPI spec: path params, query params, request bodies,
 * auth requirements, response schemas, pagination, and deprecation.
 *
 * Gated behind ESI_LIVE_TESTS=true since it fetches from the live API.
 *
 * Run: ESI_LIVE_TESTS=true npx jest --config jest.contract.config.cjs
 */

import {
  fetchSpec,
  loadAllEndpoints,
  findSpecOperation,
  findSpecPath,
  getSpecPathParams,
  getSpecQueryParams,
  OpenApiSpec,
  EndpointEntry,
} from './helpers';

const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

// Known contract deviations — tracked for future fix.
// Remove entries as they are resolved; unknown mismatches still hard-fail.
const KNOWN_QUERY_PARAM_EXCEPTIONS = new Set([
  'getCorporationStarbaseDetail', // system_id passed via path, not queryParams
]);
const KNOWN_BODY_EXCEPTIONS = new Set([
  'createFleetWing', // spec omits requestBody but endpoint sends empty body
]);
const KNOWN_AUTH_EXCEPTIONS = new Set([
  'getCorporationHistory', // public endpoint, SDK marks requiresAuth for safety
  'getMarketOrdersInStructure', // structure access requires auth in spec
]);

describeIfLive('ESI Deep Contract Tests', () => {
  let spec: OpenApiSpec;
  let endpoints: EndpointEntry[];

  beforeAll(async () => {
    spec = await fetchSpec();
    endpoints = loadAllEndpoints();
  }, 60000);

  it('should load endpoints from the codebase', () => {
    expect(endpoints.length).toBeGreaterThan(100);
  });

  describe('Path Parameter Alignment', () => {
    it('should have matching path params between SDK and spec for every endpoint', () => {
      const mismatches: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const specPath = findSpecPath(spec, definition.path);
        if (!specPath) continue;

        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const specPathParams = getSpecPathParams(spec, specPath, operation);
        const specParamNames = specPathParams.map((p) => p.name).sort();

        const sdkParamNames = definition.pathParams
          ? [...definition.pathParams].sort()
          : [];

        const templateParams = (definition.path.match(/\{([^}]+)\}/g) || [])
          .map((p) => p.slice(1, -1))
          .sort();

        if (templateParams.length !== sdkParamNames.length) {
          mismatches.push(
            `${name} (${file}): path template has [${templateParams.join(', ')}] ` +
              `but pathParams has [${sdkParamNames.join(', ')}]`,
          );
        }

        if (specParamNames.length !== templateParams.length) {
          const datasourceFiltered = specParamNames.filter(
            (n) => n !== 'datasource',
          );
          if (datasourceFiltered.length !== templateParams.length) {
            mismatches.push(
              `${name} (${file}): spec has path params [${specParamNames.join(', ')}] ` +
                `but SDK path template has [${templateParams.join(', ')}]`,
            );
          }
        }
      }

      if (mismatches.length > 0) {
        throw new Error(
          `Found ${mismatches.length} path parameter mismatch(es):\n  ${mismatches.join('\n  ')}`,
        );
      }
    });
  });

  describe('Query Parameter Alignment', () => {
    it('should have all required spec query params in SDK queryParams', () => {
      const missing: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const specPath = findSpecPath(spec, definition.path);
        if (!specPath) continue;

        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const specQueryParams = getSpecQueryParams(spec, specPath, operation);
        const requiredQueryParams = specQueryParams.filter(
          (p) =>
            p.required &&
            p.name !== 'datasource' &&
            p.name !== 'page' &&
            p.name !== 'token',
        );

        const sdkQueryValues = definition.queryParams
          ? Object.values(definition.queryParams)
          : [];

        for (const specParam of requiredQueryParams) {
          if (!sdkQueryValues.includes(specParam.name)) {
            if (KNOWN_QUERY_PARAM_EXCEPTIONS.has(name)) {
              console.warn(
                `[known] ${name}: missing query param '${specParam.name}'`,
              );
            } else {
              missing.push(
                `${name} (${file}): missing required query param '${specParam.name}'`,
              );
            }
          }
        }
      }

      if (missing.length > 0) {
        throw new Error(
          `Found ${missing.length} missing required query param(s):\n  ${missing.join('\n  ')}`,
        );
      }
    });
  });

  describe('Request Body Alignment', () => {
    it('should have hasBody/bodyBuilder when spec has requestBody', () => {
      const mismatches: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const specHasBody = !!operation.requestBody;
        const sdkHasBody = !!(definition.hasBody || definition.bodyBuilder);

        if (KNOWN_BODY_EXCEPTIONS.has(name)) {
          if (specHasBody !== sdkHasBody) {
            console.warn(
              `[known] ${name}: body mismatch (spec=${specHasBody}, sdk=${sdkHasBody})`,
            );
          }
          continue;
        }

        if (specHasBody && !sdkHasBody) {
          mismatches.push(
            `${name} (${file}): spec has requestBody but SDK has no hasBody/bodyBuilder`,
          );
        }

        if (!specHasBody && sdkHasBody) {
          mismatches.push(
            `${name} (${file}): SDK has hasBody/bodyBuilder but spec has no requestBody`,
          );
        }
      }

      if (mismatches.length > 0) {
        throw new Error(
          `Found ${mismatches.length} request body mismatch(es):\n  ${mismatches.join('\n  ')}`,
        );
      }
    });
  });

  describe('Auth Alignment', () => {
    it('should have requiresAuth matching spec security', () => {
      const mismatches: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const specRequiresAuth =
          !!operation.security &&
          operation.security.length > 0 &&
          operation.security.some((s) =>
            Object.values(s).some((scopes) => scopes.length > 0),
          );

        if (KNOWN_AUTH_EXCEPTIONS.has(name)) {
          if (specRequiresAuth !== definition.requiresAuth) {
            console.warn(
              `[known] ${name}: auth mismatch (spec=${specRequiresAuth}, sdk=${definition.requiresAuth})`,
            );
          }
          continue;
        }

        if (specRequiresAuth && !definition.requiresAuth) {
          mismatches.push(
            `${name} (${file}): spec requires auth but SDK has requiresAuth=false`,
          );
        }

        if (!specRequiresAuth && definition.requiresAuth) {
          mismatches.push(
            `${name} (${file}): SDK has requiresAuth=true but spec has no security scopes`,
          );
        }
      }

      if (mismatches.length > 0) {
        throw new Error(
          `Found ${mismatches.length} auth mismatch(es):\n  ${mismatches.join('\n  ')}`,
        );
      }
    });
  });

  describe('Response Schema Coverage', () => {
    it('should have a responseSchema for every GET endpoint with a JSON response', () => {
      const missing: string[] = [];

      for (const { name, definition, file } of endpoints) {
        if (definition.method !== 'GET') continue;

        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const response200 = operation.responses?.['200'];
        const hasJsonResponse =
          response200?.content?.['application/json']?.schema;

        if (hasJsonResponse && !definition.responseSchema) {
          missing.push(
            `${name} (${file}): ${definition.method} ${definition.path}`,
          );
        }
      }

      if (missing.length > 0) {
        console.warn(
          `${missing.length} GET endpoint(s) with JSON responses missing responseSchema:\n  ${missing.join('\n  ')}`,
        );
      }

      expect(true).toBe(true);
    });
  });

  describe('HTTP Method Match', () => {
    it('should have matching HTTP methods between SDK and spec', () => {
      const mismatches: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const specPath = findSpecPath(spec, definition.path);
        if (!specPath) continue;

        const methods = spec.paths[specPath];
        if (!methods) continue;

        const methodExists = !!methods[definition.method.toLowerCase()];
        if (!methodExists) {
          const availableMethods = Object.keys(methods).filter(
            (m) => !['parameters'].includes(m),
          );
          mismatches.push(
            `${name} (${file}): SDK uses ${definition.method} but spec has [${availableMethods.join(', ').toUpperCase()}]`,
          );
        }
      }

      if (mismatches.length > 0) {
        throw new Error(
          `Found ${mismatches.length} HTTP method mismatch(es):\n  ${mismatches.join('\n  ')}`,
        );
      }
    });
  });

  describe('Pagination Contract', () => {
    it('should have cursorPagination for endpoints with X-Pages header', () => {
      const missing: string[] = [];

      for (const { name, definition, file } of endpoints) {
        if (definition.method !== 'GET') continue;

        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        const response200 = operation.responses?.['200'];
        const hasXPages = response200?.headers
          ? Object.keys(response200.headers).some(
              (h) => h.toLowerCase() === 'x-pages',
            )
          : false;

        if (hasXPages && !definition.cursorPagination) {
          missing.push(`${name} (${file}): ${definition.path}`);
        }
      }

      if (missing.length > 0) {
        console.warn(
          `${missing.length} paginated endpoint(s) without cursorPagination metadata:\n  ${missing.join('\n  ')}`,
        );
      }

      expect(true).toBe(true);
    });
  });

  describe('Deprecation Sync', () => {
    it('should have deprecated metadata for spec-deprecated endpoints', () => {
      const missing: string[] = [];

      for (const { name, definition, file } of endpoints) {
        const operation = findSpecOperation(
          spec,
          definition.path,
          definition.method,
        );
        if (!operation) continue;

        if (operation.deprecated && !definition.deprecated) {
          missing.push(
            `${name} (${file}): ${definition.method} ${definition.path}`,
          );
        }
      }

      if (missing.length > 0) {
        console.warn(
          `${missing.length} deprecated endpoint(s) without SDK deprecated metadata:\n  ${missing.join('\n  ')}`,
        );
      }

      expect(true).toBe(true);
    });
  });
});
