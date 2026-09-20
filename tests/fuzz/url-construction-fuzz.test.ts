/**
 * URL Construction Fuzz Tests
 *
 * Property-based testing of buildEndpointPath() from
 * src/core/endpoints/buildEndpointPath.ts using fast-check.
 */

import * as fc from 'fast-check';
import { buildEndpointPath } from '../../src/core/endpoints/buildEndpointPath';
import { EndpointDefinition } from '../../src/core/endpoints/EndpointDefinition';

const singleParamDef: EndpointDefinition = {
  path: 'characters/{characterId}/',
  method: 'GET',
  requiresAuth: false,
  pathParams: ['characterId'],
};

const multiParamDef: EndpointDefinition = {
  path: 'characters/{characterId}/contracts/{contractId}/items',
  method: 'GET',
  requiresAuth: true,
  pathParams: ['characterId', 'contractId'],
};

const queryParamDef: EndpointDefinition = {
  path: 'markets/{regionId}/orders/',
  method: 'GET',
  requiresAuth: false,
  pathParams: ['regionId'],
  queryParams: { orderType: 'order_type' },
};

describe('URL Construction Fuzz Tests', () => {
  describe('buildEndpointPath with valid integer IDs', () => {
    it('should never leave unsubstituted {param} placeholders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (id) => {
            const result = buildEndpointPath(singleParamDef, [id]);
            expect(result.path).not.toContain('{');
            expect(result.path).not.toContain('}');
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should substitute multiple params correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (id1, id2) => {
            const result = buildEndpointPath(multiParamDef, [id1, id2]);
            expect(result.path).not.toContain('{');
            expect(result.path).toContain(String(id1));
            expect(result.path).toContain(String(id2));
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should include query params when provided', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          fc.constantFrom('buy', 'sell', 'all'),
          (regionId, orderType) => {
            const result = buildEndpointPath(queryParamDef, [
              regionId,
              orderType,
            ]);
            expect(result.path).toContain('order_type=');
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should omit query params when undefined', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (regionId) => {
            const result = buildEndpointPath(queryParamDef, [
              regionId,
              undefined,
            ]);
            expect(result.path).not.toContain('order_type=');
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe('buildEndpointPath with adversarial inputs', () => {
    it('should reject path traversal attempts containing slashes', () => {
      const traversalWithSlashes = ['../..', '..\\..', 'foo/bar', 'a\\b'];
      for (const input of traversalWithSlashes) {
        expect(() => {
          buildEndpointPath(singleParamDef, [input]);
        }).toThrow(/invalid characters/);
      }
    });

    it('should safely handle dot-dot without slashes via encodeURIComponent', () => {
      const result = buildEndpointPath(singleParamDef, ['..']);
      expect(result.path).toContain(encodeURIComponent('..'));
    });

    it('should reject inputs with slashes', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0 && s.includes('/')),
          (input) => {
            expect(() => {
              buildEndpointPath(singleParamDef, [input]);
            }).toThrow(/invalid characters/);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject null/undefined/empty path params', () => {
      for (const input of [null, undefined, '']) {
        expect(() => {
          buildEndpointPath(singleParamDef, [input]);
        }).toThrow(/must not be empty/);
      }
    });

    it('should reject non-finite numbers', () => {
      for (const input of [NaN, Infinity, -Infinity]) {
        expect(() => {
          buildEndpointPath(singleParamDef, [input]);
        }).toThrow(/must be a finite number/);
      }
    });

    it('should encode special characters that pass validation', () => {
      fc.assert(
        fc.property(
          fc
            .string()
            .filter(
              (s) => s.length > 0 && !/[/\\?#@!$&'()*+,;=<>{}|^`]/.test(s),
            ),
          (input) => {
            const result = buildEndpointPath(singleParamDef, [input]);
            expect(result.path).not.toContain('{characterId}');
            expect(result.path).toContain(encodeURIComponent(input));
          },
        ),
        { numRuns: 300 },
      );
    });
  });

  describe('buildEndpointPath with datasource', () => {
    it('should append datasource param correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999999 }),
          fc.constantFrom('tranquility', 'singularity'),
          (id, datasource) => {
            const result = buildEndpointPath(singleParamDef, [id], datasource);
            expect(result.path).toContain(`datasource=${datasource}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('buildEndpointPath body handling', () => {
    it('should extract body for hasBody endpoints', () => {
      const def: EndpointDefinition = {
        path: 'characters/{characterId}/assets/locations/',
        method: 'POST',
        requiresAuth: true,
        pathParams: ['characterId'],
        hasBody: true,
      };

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999999 }),
          fc.array(fc.integer({ min: 1, max: 999999 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (charId, itemIds) => {
            const result = buildEndpointPath(def, [charId, itemIds]);
            expect(result.body).toEqual(itemIds);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should return undefined body for GET endpoints', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 999999 }), (id) => {
          const result = buildEndpointPath(singleParamDef, [id]);
          expect(result.body).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });
  });
});
