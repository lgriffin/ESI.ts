/**
 * The mercenary den and tactical operation detail schemas of `./schemas`:
 * each accepts a valid body, rejects a wrong type and keeps an unknown field
 * (z.looseObject).
 */
import { z } from 'zod';
import {
  MercenaryDenDetailEvolutionSchema,
  MercenaryDenDetailInfomorphsSchema,
  MercenaryDenDetailReinforcementTimerSchema,
  MercenaryDenDetailSchema,
  MercenaryDenDetailSkyhookSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const evolution = {
  development: { amount: 40, level: 'Level2' },
  anarchy: { amount: 10, level: 'Level0' },
};
const infomorphs = { amount: 120 };
const timer = { end: '2026-11-14T18:00:00Z' };
const skyhook = {
  id: 1047000001,
  planet_id: 40009081,
  corporation_id: 98000002,
};
const den = {
  id: 1048000001,
  type_id: 85230,
  state: 'Running',
  skyhook,
  infomorphs,
  evolution,
  reinforcement_timer: timer,
};
const operation = {
  id: '0b1e2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  mercenary_den_id: 1048000001,
  state: 'Available',
  dungeon_type_id: 2601,
  expires: '2026-11-15T00:00:00Z',
};

const schemaCases: SchemaTestCase[] = [
  {
    name: 'MercenaryDenDetailEvolutionSchema',
    schema: MercenaryDenDetailEvolutionSchema,
    validData: evolution,
    invalidData: { ...evolution, anarchy: { amount: '10', level: 'Level0' } },
  },
  {
    name: 'MercenaryDenDetailInfomorphsSchema',
    schema: MercenaryDenDetailInfomorphsSchema,
    validData: infomorphs,
    invalidData: { amount: 'many' },
  },
  {
    name: 'MercenaryDenDetailReinforcementTimerSchema',
    schema: MercenaryDenDetailReinforcementTimerSchema,
    validData: timer,
    invalidData: { end: 1763143200 },
  },
  {
    name: 'MercenaryDenDetailSkyhookSchema',
    schema: MercenaryDenDetailSkyhookSchema,
    validData: skyhook,
    invalidData: { ...skyhook, corporation_id: '98000002' },
  },
  {
    name: 'MercenaryDenDetailSchema',
    schema: MercenaryDenDetailSchema,
    validData: den,
    invalidData: { ...den, type_id: '85230' },
  },
  {
    name: 'MercenaryTacticalOperationDetailSchema',
    schema: MercenaryTacticalOperationDetailSchema,
    validData: operation,
    invalidData: { ...operation, mercenary_den_id: '1048000001' },
  },
];

describe('mercenary detail schemas', () => {
  describe.each(schemaCases)('$name', ({ schema, validData, invalidData }) => {
    it('accepts a valid body', () => {
      expect(schema.safeParse(validData).success).toBe(true);
    });

    it('rejects a wrong type on a field', () => {
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('keeps an unknown field', () => {
      const result = schema.safeParse({ ...validData, _extra_field: 'kept' });
      expect(result.success).toBe(true);
      expect(
        (result.data as Record<string, unknown> | undefined)?._extra_field,
      ).toBe('kept');
    });
  });
});
