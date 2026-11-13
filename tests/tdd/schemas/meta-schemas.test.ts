/**
 * The meta schemas of `./schemas` (changelog, compatibility dates, name,
 * status): each accepts a valid body, rejects a wrong type and keeps an
 * unknown field (z.looseObject).
 */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  MetaChangelogEntrySchema,
  MetaChangelogSchema,
  MetaCompatibilityDatesSchema,
  MetaNameSchema,
  MetaStatusSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
  recorded?: string;
}

const entry = {
  method: 'GET',
  path: '/skyhooks/raidable',
  compatibility_date: '2025-12-16',
  type: 'new',
  description: 'Added the raidable skyhooks route.',
};

const schemaCases: SchemaTestCase[] = [
  {
    name: 'MetaChangelogEntrySchema',
    schema: MetaChangelogEntrySchema,
    validData: entry,
    invalidData: { ...entry, path: 404 },
  },
  {
    name: 'MetaChangelogSchema',
    schema: MetaChangelogSchema,
    validData: { changelog: { '2025-12-16': [entry] } },
    invalidData: { changelog: { '2025-12-16': entry } },
    recorded: 'meta.getChangelog.json',
  },
  {
    name: 'MetaCompatibilityDatesSchema',
    schema: MetaCompatibilityDatesSchema,
    validData: { compatibility_dates: ['2025-08-26', '2025-12-16'] },
    invalidData: { compatibility_dates: [20250826] },
    recorded: 'meta.getCompatibilityDates.json',
  },
  {
    name: 'MetaNameSchema',
    schema: MetaNameSchema,
    validData: {
      current: 'Tranquility',
      history: [{ date: '2024-07-11', name: 'Tranquility' }],
    },
    invalidData: { current: 'Tranquility', history: 'none' },
    recorded: 'meta.getName.json',
  },
  {
    name: 'MetaStatusSchema',
    schema: MetaStatusSchema,
    validData: {
      routes: [{ method: 'GET', path: '/status', status: 'OK' }],
    },
    invalidData: { routes: [{ method: 'GET', path: '/status', status: 1 }] },
    recorded: 'meta.getStatus.json',
  },
];

function recordedBody(file: string): unknown {
  const fixture = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../contract/fixtures/recorded', file),
      'utf8',
    ),
  ) as { pages: { body: unknown }[] };
  return fixture.pages[0]!.body;
}

describe('meta schemas', () => {
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

  it.each(
    schemaCases.flatMap(({ name, schema, recorded }) =>
      recorded ? [{ name, schema, recorded }] : [],
    ),
  )('$name accepts the recorded body in $recorded', ({ schema, recorded }) => {
    expect(schema.safeParse(recordedBody(recorded)).success).toBe(true);
  });
});
