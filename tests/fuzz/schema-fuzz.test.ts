/**
 * Zod Schema Fuzz Tests
 *
 * Property-based testing of all Zod schemas from src/schemas/
 * to verify safeParse never throws, regardless of input.
 */

import * as fc from 'fast-check';
import { z } from 'zod';
import * as schemas from '../../src/schemas';

const schemaEntries = Object.entries(schemas).filter(
  ([name, value]) => name.endsWith('Schema') && value instanceof z.ZodType,
) as [string, z.ZodType][];

describe('Zod Schema Fuzz Tests', () => {
  it('should have schemas to test', () => {
    expect(schemaEntries.length).toBeGreaterThan(10);
  });

  describe('safeParse never throws', () => {
    for (const [name, schema] of schemaEntries) {
      it(`${name}.safeParse() should never throw for random input`, () => {
        fc.assert(
          fc.property(fc.anything(), (input) => {
            const result = schema.safeParse(input);
            expect(result).toHaveProperty('success');
          }),
          { numRuns: 100 },
        );
      });
    }
  });

  describe('safeParse with primitive edge cases', () => {
    const edgeCases = [
      null,
      undefined,
      0,
      -1,
      1,
      '',
      'test',
      true,
      false,
      [],
      {},
      NaN,
      Infinity,
      -Infinity,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ];

    for (const [name, schema] of schemaEntries) {
      it(`${name}.safeParse() should handle all primitive edge cases without throwing`, () => {
        for (const value of edgeCases) {
          expect(() => schema.safeParse(value)).not.toThrow();
        }
      });
    }
  });

  describe('safeParse with deeply nested objects', () => {
    for (const [name, schema] of schemaEntries) {
      it(`${name}.safeParse() should handle deeply nested objects`, () => {
        fc.assert(
          fc.property(
            fc.anything({
              maxDepth: 5,
              maxKeys: 10,
              withBigInt: false,
              withDate: false,
              withTypedArray: false,
              withSparseArray: false,
              withMap: false,
              withSet: false,
            }),
            (input) => {
              expect(() => schema.safeParse(input)).not.toThrow();
            },
          ),
          { numRuns: 50 },
        );
      });
    }
  });

  describe('parse rejects invalid input types', () => {
    for (const [name, schema] of schemaEntries) {
      it(`${name} should reject non-object primitives via safeParse`, () => {
        for (const value of [null, undefined, 42, 'string', true]) {
          const result = schema.safeParse(value);
          expect(result.success).toBe(false);
        }
      });
    }
  });
});
