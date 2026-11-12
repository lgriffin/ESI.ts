/**
 * The corporation order history and structure order schemas of `./schemas`:
 * each accepts a valid body, rejects a wrong type and keeps an unknown field
 * (z.looseObject).
 */
import { z } from 'zod';
import {
  CorporationMarketOrderHistorySchema,
  StructureMarketOrderSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const historyOrder = {
  order_id: 6500000001,
  type_id: 34,
  location_id: 60003760,
  volume_total: 10000,
  volume_remain: 0,
  min_volume: 1,
  price: 5.25,
  is_buy_order: true,
  issued_by: 2112625428,
  region_id: 10000002,
  wallet_division: 1,
  duration: 90,
  issued: '2026-10-01T12:00:00Z',
  range: 'station',
  state: 'expired',
  escrow: 0,
};
const structureOrder = {
  order_id: 6500000002,
  type_id: 34,
  location_id: 1035466617946,
  volume_total: 5000,
  volume_remain: 4200,
  min_volume: 1,
  price: 5.5,
  is_buy_order: false,
  duration: 30,
  issued: '2026-11-01T08:00:00Z',
  range: 'region',
};

const schemaCases: SchemaTestCase[] = [
  {
    name: 'CorporationMarketOrderHistorySchema',
    schema: CorporationMarketOrderHistorySchema,
    validData: historyOrder,
    invalidData: { ...historyOrder, wallet_division: 'master' },
  },
  {
    name: 'StructureMarketOrderSchema',
    schema: StructureMarketOrderSchema,
    validData: structureOrder,
    invalidData: { ...structureOrder, is_buy_order: 'false' },
  },
];

describe('market order schemas', () => {
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
