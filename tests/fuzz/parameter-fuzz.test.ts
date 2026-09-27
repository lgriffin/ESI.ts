/**
 * Parameter Validation Fuzz Tests
 *
 * Property-based testing of validatePathParam() and validateQueryParam()
 * from src/core/util/validation.ts using fast-check.
 */

import * as fc from 'fast-check';
import {
  validatePathParam,
  validateQueryParam,
} from '../../src/core/util/validation';

const UNSAFE_PATH_CHARS = /[/\\?#@!$&'()*+,;=<>{}|^`]/;
const isDotSegment = (s: string): boolean => s === '.' || s === '..';

describe('Parameter Validation Fuzz Tests', () => {
  describe('validatePathParam', () => {
    it('should always return a string for positive integers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (id) => {
            const result = validatePathParam('test_id', id);
            expect(typeof result).toBe('string');
            expect(result).toBe(String(id));
          },
        ),
        { numRuns: 1000 },
      );
    });

    it('should reject null, undefined, and empty string', () => {
      for (const value of [null, undefined, '']) {
        expect(() => validatePathParam('test_id', value)).toThrow(
          /must not be empty/,
        );
      }
    });

    it('should reject strings containing unsafe path characters', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0 && UNSAFE_PATH_CHARS.test(s)),
          (input) => {
            expect(() => validatePathParam('test_id', input)).toThrow(
              /invalid characters/,
            );
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should accept strings without unsafe characters', () => {
      fc.assert(
        fc.property(
          fc
            .string()
            .filter(
              (s) =>
                s.length > 0 && !UNSAFE_PATH_CHARS.test(s) && !isDotSegment(s),
            ),
          (input) => {
            if (typeof input === 'string') {
              const result = validatePathParam('test_id', input);
              expect(typeof result).toBe('string');
            }
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should reject NaN, Infinity, and -Infinity', () => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(() => validatePathParam('test_id', value)).toThrow(
          /must be a finite number/,
        );
      }
    });

    // Non-primitive inputs are not rejected outright: an object stringifies
    // to '[object Object]', which is a valid segment. What must hold is that
    // whatever is returned is safe to splice into the path.
    it('should only return a non-empty, safe segment for non-string/non-number inputs', () => {
      fc.assert(
        fc.property(
          fc
            .anything()
            .filter(
              (v) =>
                v !== null &&
                v !== undefined &&
                typeof v !== 'string' &&
                typeof v !== 'number' &&
                typeof v !== 'boolean',
            ),
          (input) => {
            let result: string;
            try {
              result = validatePathParam('test_id', input);
            } catch {
              return; // Rejected: nothing reaches the path.
            }
            expect(result).not.toBe('');
            expect(result).not.toMatch(UNSAFE_PATH_CHARS);
            expect(isDotSegment(result)).toBe(false);
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should handle large numbers correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (id) => {
            const result = validatePathParam('test_id', id);
            expect(result).toBe(String(id));
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should handle zero', () => {
      const result = validatePathParam('test_id', 0);
      expect(result).toBe('0');
    });

    it('should handle negative integers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: -1 }),
          (id) => {
            const result = validatePathParam('test_id', id);
            expect(result).toBe(String(id));
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe('validateQueryParam', () => {
    it('should reject null and undefined', () => {
      expect(() => validateQueryParam('test', null)).toThrow(
        /must not be null or undefined/,
      );
      expect(() => validateQueryParam('test', undefined)).toThrow(
        /must not be null or undefined/,
      );
    });

    it('should reject non-finite numbers', () => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(() => validateQueryParam('test', value)).toThrow(
          /must be a finite number/,
        );
      }
    });

    it('should reject strings exceeding 2000 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2001, maxLength: 3000 }),
          (input) => {
            expect(() => validateQueryParam('test', input)).toThrow(
              /exceeds maximum length/,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept valid strings under 2000 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 2000 }), (input) => {
          const result = validateQueryParam('test', input);
          expect(typeof result).toBe('string');
        }),
        { numRuns: 500 },
      );
    });

    it('should accept valid integers', () => {
      fc.assert(
        fc.property(fc.integer(), (id) => {
          const result = validateQueryParam('test', id);
          expect(result).toBe(String(id));
        }),
        { numRuns: 500 },
      );
    });

    // Non-primitive inputs are not rejected outright: an array stringifies
    // to its comma-joined elements. What must hold is that whatever is
    // returned is the input's string form, within the length limit.
    it('should only return the string form, within the length limit, for non-primitive inputs', () => {
      fc.assert(
        fc.property(
          fc
            .anything()
            .filter(
              (v) =>
                v !== null &&
                v !== undefined &&
                typeof v !== 'string' &&
                typeof v !== 'number' &&
                typeof v !== 'boolean',
            ),
          (input) => {
            let result: string;
            try {
              result = validateQueryParam('test', input);
            } catch {
              return; // Rejected: nothing reaches the query string.
            }
            expect(result).toBe(`${input as string}`);
            expect(result.length).toBeLessThanOrEqual(2000);
          },
        ),
        { numRuns: 500 },
      );
    });
  });
});
