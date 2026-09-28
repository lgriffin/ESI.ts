/**
 * SDE schemas: generated records round-trip through every schema in
 * `src/sde/domain/schemas.ts`, and a record missing a required key is rejected.
 *
 * For each entity schema an arbitrary is derived from the zod definition
 * itself (`schemaArbitrary`), so a new field or a new schema is covered the
 * day it is added. Two checks per schema:
 *
 *   round trip   `parse` accepts a generated record and returns it unchanged,
 *                with an unknown extra field kept (the schemas are
 *                `looseObject`s so ESI's extra fields survive);
 *   required key `safeParse` rejects the same record with one required key
 *                removed, whichever key it is.
 *
 * `FC_NUM_RUNS` and `FC_SEED` are honoured as in the property files
 * (tests/fuzz/AGENTS.md); this file is a plain fast-check suite, so the
 * vacuity harness of `describeProperty` does not apply. The required-key
 * check is its sharpness signal: a generator that produced records the
 * schema does not look at could not make it fail.
 */
import * as fc from 'fast-check';
import { z } from 'zod';

import * as schemas from '../../src/sde/domain/schemas';
import { readRunSettings } from './support/property';
import { requiredKeys, schemaArbitrary } from './support/sde';

const settings = readRunSettings();
const params: fc.Parameters<unknown> = {
  numRuns: settings.numRuns,
  seed: settings.seed,
  path: settings.path,
};

const entitySchemas = Object.entries(schemas).filter(
  ([name, value]) => name.endsWith('Schema') && value instanceof z.ZodType,
) as [string, z.ZodObject][];

const EXTRA_FIELD = 'fieldEsiAddedLater';

describe('SDE schema fuzz', () => {
  it('covers every schema the module exports', () => {
    expect(entitySchemas.length).toBeGreaterThan(100);
  });

  describe('a generated record round-trips unchanged, extra fields kept', () => {
    for (const [name, schema] of entitySchemas) {
      it(name, () => {
        fc.assert(
          fc.property(
            schemaArbitrary(schema),
            fc.string({ maxLength: 6 }),
            (record, extra) => {
              const input = { ...(record as object), [EXTRA_FIELD]: extra };
              expect(schema.parse(input)).toEqual(input);
            },
          ),
          params,
        );
      });
    }
  });

  describe('a record missing a required key is rejected', () => {
    for (const [name, schema] of entitySchemas) {
      const required = requiredKeys(schema);
      if (required.length === 0) continue;
      it(name, () => {
        fc.assert(
          fc.property(
            schemaArbitrary(schema),
            fc.constantFrom(...required),
            (record, key) => {
              const input = { ...(record as object) } as Record<
                string,
                unknown
              >;
              delete input[key];
              const result = schema.safeParse(input);
              expect(result.success).toBe(false);
              expect(result.error?.issues.map((i) => i.path[0])).toContain(key);
            },
          ),
          params,
        );
      });
    }
  });

  it('every schema but the all-optional blueprint activities declares a required key', () => {
    const bare = entitySchemas
      .filter(([, schema]) => requiredKeys(schema).length === 0)
      .map(([name]) => name);
    // Every activity of a blueprint is optional; a schema with no required
    // key has no rejection check above, so the list is kept explicit.
    expect(bare).toEqual(['BlueprintActivitiesSchema']);
  });
});
