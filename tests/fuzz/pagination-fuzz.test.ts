/**
 * Pagination Fuzz Tests
 *
 * Property-based testing of pagination parameter handling
 * to verify edge-case page values are handled gracefully.
 */

import * as fc from 'fast-check';
import { buildEndpointPath } from '../../src/core/endpoints/buildEndpointPath';
import { EndpointDefinition } from '../../src/core/endpoints/EndpointDefinition';

const paginatedDef: EndpointDefinition = {
  path: 'markets/{regionId}/orders/',
  method: 'GET',
  requiresAuth: false,
  pathParams: ['regionId'],
  queryParams: { page: 'page' },
};

describe('Pagination Fuzz Tests', () => {
  describe('page parameter via buildEndpointPath', () => {
    it('should include valid page numbers in the query string', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (page) => {
          const result = buildEndpointPath(paginatedDef, [10000002, page]);
          expect(result.path).toContain(`page=${page}`);
        }),
        { numRuns: 200 },
      );
    });

    it('should handle zero page gracefully', () => {
      const result = buildEndpointPath(paginatedDef, [10000002, 0]);
      expect(result.path).toContain('page=0');
    });

    it('should handle negative page numbers without crashing', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (page) => {
          const result = buildEndpointPath(paginatedDef, [10000002, page]);
          expect(result.path).toContain(`page=${page}`);
        }),
        { numRuns: 100 },
      );
    });

    it('should handle very large page numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000, max: Number.MAX_SAFE_INTEGER }),
          (page) => {
            const result = buildEndpointPath(paginatedDef, [10000002, page]);
            expect(result.path).toContain('page=');
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should omit page when undefined', () => {
      const result = buildEndpointPath(paginatedDef, [10000002, undefined]);
      expect(result.path).not.toContain('page=');
    });

    it('should reject NaN and Infinity for page', () => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(() => {
          buildEndpointPath(paginatedDef, [10000002, value]);
        }).toThrow(/must be a finite number/);
      }
    });

    it('should handle float page numbers', () => {
      fc.assert(
        fc.property(fc.double({ min: 0.1, max: 1000, noNaN: true }), (page) => {
          if (!Number.isFinite(page)) return;
          const result = buildEndpointPath(paginatedDef, [10000002, page]);
          expect(result.path).toContain('page=');
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('page parameter as string', () => {
    it('should handle numeric string page values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99999 }).map(String),
          (pageStr) => {
            const result = buildEndpointPath(paginatedDef, [10000002, pageStr]);
            expect(result.path).toContain('page=');
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
