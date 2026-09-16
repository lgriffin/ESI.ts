/**
 * Self-tests for the Rule ↔ schema consistency check.
 *
 * The check is meant to become a hard gate, so it has to be right in both
 * directions: every negative fixture below is a Rule that promises an
 * optional field without qualification and must be reported, and every
 * positive fixture is a Rule that looks similar but is honest and must pass.
 * A matcher change that trades one for the other fails here first.
 *
 * The matching logic is imported directly. The CLI is driven in a child
 * process against two fixture features, because it parses Gherkin with the
 * ESM-only `@cucumber/gherkin`, which Jest's CommonJS runtime cannot load —
 * the same arrangement, and the same Node-version skip, as spec-audit.test.ts.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';
import { z } from 'zod';

import {
  SchemaObject,
  checkRuleTitle,
  checkWarnOnlyList,
  collectSchemaObjects,
  domainOfFeature,
  endpointFileCandidates,
  endpointsNamedBy,
  findFieldMentions,
  mapFeatureToEndpoints,
} from '../../../scripts/rule-schema-checks';

const REPO_ROOT = path.resolve(__dirname, '../../..');

// ---------------------------------------------------------------------------
// Fixture schemas — shaped like the real ones, small enough to reason about
// ---------------------------------------------------------------------------

const ClonesSchema = z.looseObject({
  home_location: z
    .looseObject({ location_id: z.number(), location_type: z.string() })
    .optional(),
  jump_clones: z.array(
    z.looseObject({ jump_clone_id: z.number(), implants: z.array(z.number()) }),
  ),
  last_clone_jump_date: z.string().optional(),
});

const ProfileSchema = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  alliance_id: z.number().optional(),
  corporation_id: z.number(),
});

const MedalSchema = z.looseObject({
  medal_id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
});

const LocationSchema = z.looseObject({
  solar_system_id: z.number(),
  station_id: z.number().optional(),
  structure_id: z.number().optional(),
});

const AttributesSchema = z.looseObject({
  intelligence: z.number(),
  bonus_remaps: z.number().optional(),
});

const StructureSchema = z.looseObject({
  name: z.string(),
  solar_system_id: z.number(),
  position: z.looseObject({ x: z.number() }).optional(),
});

const PlanetSchema = z.looseObject({
  name: z.string(),
  system_id: z.number(),
  position: z.looseObject({ x: z.number() }),
});

const StationSchema = z.looseObject({
  name: z.string(),
  max_dockable_ship_volume: z.number(),
});

const TypeSchema = z.looseObject({
  name: z.string(),
  volume: z.number().optional(),
});

const ListingSchema = z.looseObject({
  price: z.looseObject({
    isk: z.number().optional(),
    plex: z.number().optional(),
  }),
  cursor: z.looseObject({ before: z.string().nullable() }),
});

const objects: SchemaObject[] = [
  ...collectSchemaObjects(ClonesSchema, 'getClones'),
  ...collectSchemaObjects(ProfileSchema, 'getCharacterPublicInfo'),
  ...collectSchemaObjects(z.array(MedalSchema), 'getMedals'),
  ...collectSchemaObjects(LocationSchema, 'getCharacterLocation'),
  ...collectSchemaObjects(AttributesSchema, 'getCharacterAttributes'),
  ...collectSchemaObjects(StructureSchema, 'getStructureById'),
  ...collectSchemaObjects(PlanetSchema, 'getPlanetById'),
  ...collectSchemaObjects(StationSchema, 'getStationById'),
  ...collectSchemaObjects(TypeSchema, 'getTypeById'),
  ...collectSchemaObjects(z.array(ListingSchema), 'getPublicListings'),
];

const flagged = (title: string): string[] =>
  checkRuleTitle(title, objects).map((f) => f.field);

describe('rule-schema-check', () => {
  describe('schema introspection', () => {
    it('records each object at any depth with the optionality of its fields', () => {
      const found = collectSchemaObjects(ClonesSchema, 'getClones');

      expect(found.map((o) => o.label)).toEqual([
        'getClones',
        'getClones.home_location',
        'getClones.jump_clones[]',
      ]);
      expect(found[0]!.fields.get('home_location')).toBe(true);
      expect(found[0]!.fields.get('jump_clones')).toBe(false);
      expect(found[1]!.fields.get('location_id')).toBe(false);
    });

    it('treats a nullable field as present, not optional', () => {
      const [, , cursor] = collectSchemaObjects(
        z.array(ListingSchema),
        'getPublicListings',
      );

      expect(cursor!.label).toBe('getPublicListings[].cursor');
      expect(cursor!.fields.get('before')).toBe(false);
    });
  });

  describe('reports a Rule that promises an optional field', () => {
    it.each<[string, string, string[]]>([
      [
        'by its identifier',
        'When clone information is requested, the Clones client shall return a record carrying home_location and jump_clones.',
        ['home_location'],
      ],
      [
        'in prose',
        'When clone information is requested for a character ID, the Clones client shall return a record carrying the home location and one entry per jump clone.',
        ['home_location'],
      ],
      [
        'in prose with the plural dropped',
        'When character attributes are requested, the Skills client shall return the intelligence value along with the remaining bonus remap count.',
        ['bonus_remaps'],
      ],
      [
        'as an identifier spelled out',
        'When the client requests the location of a docked character, the Location client shall return the solar system identifier together with the station identifier.',
        ['station_id'],
      ],
      [
        'among required ones, reporting only the optional ones',
        'When the public profile is requested, the Characters client shall return a record carrying name, corporation_id, and alliance_id.',
        ['alliance_id'],
      ],
      [
        'placed after a qualifier that covers only the fields before it',
        'When the public profile is requested, the Characters client shall return a record carrying corporation_id when present and alliance_id.',
        ['alliance_id'],
      ],
      [
        'on the endpoint the trigger names, not a lookalike',
        'When a structure is requested by identifier, the Universe client shall return its name and position vector.',
        ['position'],
      ],
    ])('%s', (_case, title, expected) => {
      expect(flagged(title)).toEqual(expected);
    });

    it('names the schema objects that make the field optional', () => {
      const [finding] = checkRuleTitle(
        'When clone information is requested, the Clones client shall return home_location.',
        objects,
      );

      expect(finding).toEqual({
        field: 'home_location',
        mention: 'home_location',
        schemas: ['getClones'],
      });
    });
  });

  describe('passes a Rule that is honest about optional fields', () => {
    it.each<[string, string]>([
      [
        'qualified with "when present"',
        'When clone information is requested, the Clones client shall return one entry per jump clone and the home location when present.',
      ],
      [
        'qualified with "if present" after a list',
        'When the public profile is requested, the Characters client shall return name, corporation_id, and alliance_id if present.',
      ],
      [
        'qualified with "when both are present"',
        'When the public profile is requested, the Characters client shall return a description differing from the alliance_id when both are present.',
      ],
      [
        'qualified with "when ESI supplies it"',
        'When clone information is requested, the Clones client shall return the home location when ESI supplies it.',
      ],
      [
        'marked optional in place',
        'When clone information is requested, the Clones client shall return jump clones and the optional home_location.',
      ],
      [
        'offered as alternatives',
        'When public listings are requested, the ParagonHub client shall return each listing with a price denominated in either ISK or PLEX.',
      ],
      [
        'denied rather than promised',
        'While a character is in space, the Location client shall return the solar system identifier with no station identifier.',
      ],
      [
        'named only in the trigger',
        'When a home_location is used to look up a station, the Clones client shall return that station.',
      ],
      [
        'required in the object the title means, though optional elsewhere',
        'When medals are requested, the Characters client shall return entries carrying medal_id, title, description, and date.',
      ],
      [
        'required on the endpoint the trigger names, though optional on a lookalike',
        'When a planet is requested by identifier, the Universe client shall return its name, host solar system identifier, and position vector.',
      ],
      [
        'a prose word the named endpoint does not declare',
        'When a station is requested by identifier, the Universe client shall return its name and maximum dockable ship volume.',
      ],
      [
        'a request parameter written as "alliance ID"',
        'When public profiles are requested concurrently, the Characters client shall resolve each call with the record belonging to its own alliance ID.',
      ],
      [
        'a nullable field',
        'When public listings are requested, the ParagonHub client shall return a cursor carrying before.',
      ],
      ['no requirement at all', 'The Clones client returns home_location.'],
    ])('%s', (_case, title) => {
      expect(flagged(title)).toEqual([]);
    });
  });

  describe('matching helpers', () => {
    it('keeps the longest mention where two overlap', () => {
      const mentions = findFieldMentions('the host solar system identifier', [
        'system_id',
        'solar_system_id',
      ]);

      expect(mentions.map((m) => m.field)).toEqual(['solar_system_id']);
    });

    it('selects the most specific endpoints the trigger names', () => {
      expect(
        endpointsNamedBy('When corporation assets are requested', [
          'getAssets',
          'getCorporationAssets',
          'getCharacterAssets',
        ]),
      ).toEqual(['getCorporationAssets']);
    });

    it('selects no endpoint when the trigger names none', () => {
      expect(
        endpointsNamedBy('When two lookups run together', ['getPlanetById']),
      ).toEqual([]);
    });
  });

  describe('feature file to endpoint definitions', () => {
    it('reads the domain from a numbered core feature', () => {
      expect(
        domainOfFeature('tests/bdd/features/core/0015-freelance-jobs.feature'),
      ).toBe('freelance-jobs');
    });

    it.each([
      'tests/bdd/features/core/0051-resilience.feature',
      'tests/bdd/features/integration/0001-integration-workflows.feature',
      'tests/bdd/features/sde/0001-sde.feature',
    ])('treats %s as having no domain schema', (feature) => {
      expect(domainOfFeature(feature)).toBeNull();
      expect(mapFeatureToEndpoints(feature)).toBeNull();
    });

    it('tries the client name, then its singular resource name', () => {
      expect(endpointFileCandidates('military-campaigns')).toEqual([
        'militaryCampaignsEndpoints.ts',
        'militaryCampaignEndpoints.ts',
      ]);
      expect(endpointFileCandidates('dogma')).toEqual(['dogmaEndpoints.ts']);
    });

    it('resolves the clones feature to the clone endpoint schemas', () => {
      const source = mapFeatureToEndpoints(
        'tests/bdd/features/core/0007-clones.feature',
      );

      expect(source!.file).toBe('cloneEndpoints.ts');
      const clones = source!.objects.find((o) => o.label === 'getClones');
      expect(clones!.fields.get('home_location')).toBe(true);
    });

    it('fails loudly for a domain feature with no endpoint definitions', () => {
      expect(() =>
        mapFeatureToEndpoints(
          'tests/bdd/features/core/0049-nonexistent.feature',
        ),
      ).toThrow("No endpoint definitions found for domain 'nonexistent'");
    });

    it('resolves every domain feature in the specification', () => {
      const fs = jest.requireActual<typeof import('fs')>('fs');
      const dir = path.join(REPO_ROOT, 'tests/bdd/features/core');
      const domainFeatures = fs
        .readdirSync(dir)
        .map((name) => `tests/bdd/features/core/${name}`)
        .filter((rel) => domainOfFeature(rel) !== null);

      expect(domainFeatures.length).toBeGreaterThan(30);
      for (const rel of domainFeatures) {
        expect(() => mapFeatureToEndpoints(rel)).not.toThrow();
      }
    });
  });

  describe('warn-only list ratchet', () => {
    const clones = 'tests/bdd/features/core/0007-clones.feature';
    const status = 'tests/bdd/features/core/0034-status.feature';
    const checked = new Set([clones, status]);

    it('accepts an entry in the baseline whose file still has findings', () => {
      expect(
        checkWarnOnlyList(
          [clones],
          { ref: 'origin/master', present: true, entries: new Set([clones]) },
          checked,
          new Set([clones]),
        ),
      ).toEqual({ added: [], dangling: [], stale: [] });
    });

    it('rejects an entry absent from the baseline', () => {
      const { added } = checkWarnOnlyList(
        [clones],
        { ref: 'origin/master', present: true, entries: new Set() },
        checked,
        new Set([clones]),
      );

      expect(added).toEqual([clones]);
    });

    it('rejects every entry when no baseline ref resolves', () => {
      const { added } = checkWarnOnlyList(
        [clones],
        null,
        checked,
        new Set([clones]),
      );

      expect(added).toEqual([clones]);
    });

    it('accepts the starting entries when this change introduces the list', () => {
      const { added } = checkWarnOnlyList(
        [clones],
        { ref: 'origin/master', present: false, entries: new Set() },
        checked,
        new Set([clones]),
      );

      expect(added).toEqual([]);
    });

    it('rejects an entry whose file has no findings left', () => {
      const { stale } = checkWarnOnlyList(
        [clones, status],
        {
          ref: 'origin/master',
          present: true,
          entries: new Set([clones, status]),
        },
        checked,
        new Set([clones]),
      );

      expect(stale).toEqual([status]);
    });

    it('does not call an entry stale when its file was not part of the run', () => {
      const { stale } = checkWarnOnlyList(
        [status],
        { ref: 'origin/master', present: true, entries: new Set([status]) },
        new Set([clones]),
        new Set(),
      );

      expect(stale).toEqual([]);
    });

    it('rejects an entry that names no feature file', () => {
      const deleted = 'tests/bdd/features/core/0099-deleted.feature';
      const { dangling } = checkWarnOnlyList(
        [deleted],
        { ref: 'origin/master', present: true, entries: new Set([deleted]) },
        checked,
        new Set(),
      );

      expect(dangling).toEqual([deleted]);
    });
  });
});

// ---------------------------------------------------------------------------
// CLI wiring
// ---------------------------------------------------------------------------

const FIXTURES = 'tests/tdd/rule-schema-check/fixtures';
const CLONES = 'features/core/0007-clones.feature';

function runCheck(target: string): { output: string; status: number } {
  try {
    const stdout = execFileSync(
      process.execPath,
      ['-r', 'ts-node/register', 'scripts/rule-schema-check.ts', target],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return { output: stdout, status: 0 };
  } catch (error) {
    const failure = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
      status: failure.status ?? 1,
    };
  }
}

const inconsistent = runCheck(`${FIXTURES}/inconsistent/${CLONES}`);

const CLI_UNAVAILABLE =
  /ERR_REQUIRE_ESM|Must use import to load ES Module/.test(inconsistent.output);
if (CLI_UNAVAILABLE) {
  console.warn(
    `rule-schema-check CLI fixtures skipped: the check needs require(esm), ` +
      `which Node ${process.versions.node} does not provide. See esi-v2s.8.`,
  );
}

(CLI_UNAVAILABLE ? describe.skip : describe)('rule-schema-check CLI', () => {
  it('fails on a Rule promising an optional field without qualification', () => {
    expect(inconsistent.status).toBe(1);
    expect(inconsistent.output).toContain(
      "names 'home location', but cloneEndpoints.ts marks home_location optional",
    );
    expect(inconsistent.output).toContain('FAIL: 1 Rule/schema inconsistency');
  });

  it('passes the same Rule once it qualifies the field', () => {
    const consistent = runCheck(`${FIXTURES}/consistent/${CLONES}`);

    expect(consistent.output).toContain('Domain features checked: 1');
    expect(consistent.output).toContain('PASS');
    expect(consistent.status).toBe(0);
  });
});
