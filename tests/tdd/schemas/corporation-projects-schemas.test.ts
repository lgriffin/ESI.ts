/**
 * The corporation project listing schemas of `./schemas`: each accepts a
 * valid body, rejects a wrong type and keeps an unknown field
 * (z.looseObject).
 */
import { z } from 'zod';
import {
  CorporationProjectContributorsListingSchema,
  CorporationProjectCursorSchema,
  CorporationProjectSummarySchema,
  CorporationProjectsListingSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const cursor = {
  before: 'MTc5MDQ3OTAzMjM0OS0w',
  after: 'MTc5MDQ4MTc4NjAyOS0w',
};
const summary = {
  id: '7519d7db-1e95-4d0e-bbbe-c47cd47de3c0',
  name: 'Fuel the keepstar',
  state: 'Active',
  last_modified: '2026-11-10T10:00:00Z',
  progress: { current: 400, desired: 1000 },
  reward: { initial: 100000000, remaining: 60000000 },
};
const contributor = { id: 2112625428, name: 'Test Pilot', contributed: 250 };

const schemaCases: SchemaTestCase[] = [
  {
    name: 'CorporationProjectCursorSchema',
    schema: CorporationProjectCursorSchema,
    validData: cursor,
    invalidData: { before: 17904790 },
  },
  {
    name: 'CorporationProjectSummarySchema',
    schema: CorporationProjectSummarySchema,
    validData: summary,
    invalidData: { ...summary, progress: { current: '400', desired: 1000 } },
  },
  {
    name: 'CorporationProjectsListingSchema',
    schema: CorporationProjectsListingSchema,
    validData: { cursor, projects: [summary] },
    invalidData: { cursor, projects: [{ ...summary, name: 7 }] },
  },
  {
    name: 'CorporationProjectContributorsListingSchema',
    schema: CorporationProjectContributorsListingSchema,
    validData: { contributors: [contributor], cursor },
    invalidData: { contributors: [{ ...contributor, contributed: 'lots' }] },
  },
];

describe('corporation project listing schemas', () => {
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
