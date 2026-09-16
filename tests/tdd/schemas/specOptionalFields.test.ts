/**
 * Fields the ESI OpenAPI spec marks optional are optional in the Zod schema
 * too. A schema that requires one throws EsiValidationError on every body
 * ESI sends without it.
 *
 * Each case takes an ESI-shaped body and removes one optional field at a
 * path: `a.b` walks into an object, `[]` into every element of an array.
 */
import { z } from 'zod';
import { corporationEndpoints } from '../../../src/core/endpoints/corporationEndpoints';
import { mailEndpoints } from '../../../src/core/endpoints/mailEndpoints';

interface OptionalCase {
  route: string;
  schema: z.ZodType;
  body: unknown;
  field: string;
}

function without(body: unknown, path: string): unknown {
  const copy = structuredClone(body);
  const steps = path.split(/\.|(?=\[\])/).filter(Boolean);
  const walk = (node: unknown, rest: string[]): void => {
    const [step, ...tail] = rest;
    if (step === undefined || node === null || typeof node !== 'object') {
      return;
    }
    if (step === '[]') {
      for (const item of node as unknown[]) walk(item, tail);
      return;
    }
    const record = node as Record<string, unknown>;
    if (tail.length === 0) {
      delete record[step];
      return;
    }
    walk(record[step], tail);
  };
  walk(copy, steps);
  return copy;
}

const divisions = {
  hangar: [{ division: 1, name: 'Main Hangar' }],
  wallet: [{ division: 1, name: 'Master Wallet' }],
};

const cases: OptionalCase[] = [
  // CorporationsCorporationIdStarbasesGet: only starbase_id, type_id and
  // system_id are required.
  {
    route: 'GET /corporations/{corporation_id}/starbases',
    schema: corporationEndpoints.getCorporationStarbases.responseSchema,
    body: [
      {
        starbase_id: 1000000001,
        type_id: 12235,
        system_id: 30000142,
        moon_id: 40009082,
        state: 'online',
        onlined_since: '2026-01-01T00:00:00Z',
      },
    ],
    field: '[].state',
  },
  // CorporationsCorporationIdTitlesGet: every field is optional.
  {
    route: 'GET /corporations/{corporation_id}/titles',
    schema: corporationEndpoints.getCorporationTitles.responseSchema,
    body: [{ title_id: 1, name: 'Director', roles: ['Director'] }],
    field: '[].title_id',
  },
  // CorporationsCorporationIdDivisionsGet: division and name are optional.
  {
    route: 'GET /corporations/{corporation_id}/divisions',
    schema: corporationEndpoints.getCorporationDivisions.responseSchema,
    body: divisions,
    field: 'hangar[].division',
  },
  {
    route: 'GET /corporations/{corporation_id}/divisions',
    schema: corporationEndpoints.getCorporationDivisions.responseSchema,
    body: divisions,
    field: 'wallet[].division',
  },
  // CorporationsCorporationIdMembertrackingGet: only character_id is required.
  {
    route: 'GET /corporations/{corporation_id}/membertracking',
    schema: corporationEndpoints.getCorporationMemberTracking.responseSchema,
    body: [
      {
        character_id: 90000001,
        start_date: '2026-06-01T00:00:00Z',
        location_id: 60003760,
        ship_type_id: 587,
      },
    ],
    field: '[].start_date',
  },
  // CharactersCharacterIdMailLabelsGet: every label field is optional.
  ...(['labels[].label_id', 'labels[].name'] as const).map((field) => ({
    route: 'GET /characters/{character_id}/mail/labels',
    schema: mailEndpoints.getMailLabels.responseSchema as z.ZodType,
    body: {
      labels: [{ label_id: 1, name: '[Inbox]', unread_count: 3 }],
      total_unread_count: 3,
    },
    field,
  })),
];

describe('Schemas accept bodies without the fields ESI marks optional', () => {
  it.each(cases)('$route accepts the complete body', ({ schema, body }) => {
    const result = schema.safeParse(body);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it.each(cases)(
    '$route accepts a body without $field',
    ({ schema, body, field }) => {
      const result = schema.safeParse(without(body, field));
      expect(result.success ? [] : result.error.issues).toEqual([]);
    },
  );
});
