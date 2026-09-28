/**
 * Arbitraries and the reference oracle for the SDE property files
 * (`sde-transforms`, `sde-provider-model`, `sde-schema-fuzz`).
 *
 * Data sets
 *   `sdeDataArb` generates a `MemorySdeData` set that is internally
 *   consistent: every foreign key points at a parent that exists, except for
 *   a controlled fraction (about one in ten) that dangles at an ID no table
 *   holds. IDs are unique within a table and drawn from a small range so that
 *   a random lookup hits about as often as it misses.
 *
 * Oracle
 *   `oracle(data, query)` answers a query naively over the arrays: `find` for a
 *   lookup by ID, `filter` for a foreign-key list, `includes` on the
 *   lower-cased name and `slice` for a search, the array itself for a whole
 *   table; the arrays are handed to it sorted by ID (`sortedByIdSet`), the
 *   order both providers promise (feature 0008). A provider that disagrees
 *   with the oracle on any sequence is wrong.
 *
 * Mutants
 *   `mutate(provider, defect)` wraps a real provider in a known-bad proxy for
 *   the vacuity checks: a dropped record, an ignored limit, an off-by-one ID
 *   and a foreign-key index that answers every query with its first result.
 */
import * as fc from 'fast-check';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { dump } from 'js-yaml';
import type { z } from 'zod';

import type { IStaticDataProvider } from '../../../src/sde/ports/IStaticDataProvider';
import type { MemorySdeData } from '../../../src/sde/providers/memory/MemorySdeProvider';
import { SDE_FILE_REGISTRY } from '../../../src/sde/ingestion/constants';

// ── Field names ─────────────────────────────────────────────────────────

const lowerWord = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), {
    minLength: 1,
    maxLength: 4,
  })
  .map((cs) => cs.join(''));

/** A capitalised word that cannot spell `Id` at a boundary: no initial `I`. */
const capitalWord = fc
  .tuple(fc.constantFrom(...'ABCDEFGHJKLMNOPQRSTUVWXYZ'), lowerWord)
  .map(([head, tail]) => head + tail);

/** `ID` glued to a lower-case tail (`IDs`, `IDeal`): not a boundary. */
const innerIdWord = lowerWord.map((tail) => `ID${tail}`);

/**
 * A raw SDE field name: camel-case words with `ID` tokens where CCP puts
 * them (`solarSystemID`, `regionIDCode`) and sometimes inside a word
 * (`typeIDs`), which the transform leaves alone. The generator never
 * produces `Id` at a boundary on its own, so `ID` → `Id` is reversible.
 */
export const rawFieldNameArb: fc.Arbitrary<string> = fc
  .tuple(
    lowerWord,
    fc.array(fc.oneof(capitalWord, fc.constant('ID'), innerIdWord), {
      minLength: 0,
      maxLength: 4,
    }),
  )
  .map(([head, rest]) => head + rest.join(''));

/** The inverse of `normalizeSdeFieldName` for names `rawFieldNameArb` makes. */
export function denormalizeFieldName(name: string): string {
  return name.replace(/Id(?=[A-Z]|$)/g, 'ID');
}

// ── Locale maps and nested records ──────────────────────────────────────

export const LOCALES = ['en', 'de', 'fr', 'ja', 'ru', 'zh', 'ko', 'es'];

/** A CCP localised string: a map with at least `en`, values not all strings. */
export const localeMapArb: fc.Arbitrary<Record<string, unknown>> = fc
  .tuple(
    fc.string({ maxLength: 8 }),
    fc.dictionary(
      fc.constantFrom(...LOCALES.filter((l) => l !== 'en')),
      fc.oneof(fc.string({ maxLength: 8 }), fc.integer(), fc.constant(null)),
      { maxKeys: 3 },
    ),
  )
  .map(([en, rest]) => ({ en, ...rest }));

const scalarArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer(),
  fc.double({ noNaN: true, noDefaultInfinity: true }),
  fc.string({ maxLength: 8 }),
  fc.boolean(),
  fc.constant(null),
);

/** Keys of a plain nested object; never `en`, which would make it a locale map. */
const nestedKeyArb = rawFieldNameArb.filter((k) => k !== 'en');

/**
 * A raw SDE record value up to `depth` levels deep: scalars, locale maps,
 * arrays and plain objects whose keys need renaming.
 */
export function rawValueArb(depth: number): fc.Arbitrary<unknown> {
  if (depth === 0) return fc.oneof(scalarArb, localeMapArb);
  return fc.oneof(
    { arbitrary: scalarArb, weight: 3 },
    { arbitrary: localeMapArb, weight: 2 },
    {
      arbitrary: fc.array(rawValueArb(depth - 1), { maxLength: 3 }),
      weight: 1,
    },
    {
      arbitrary: fc.dictionary(nestedKeyArb, rawValueArb(depth - 1), {
        maxKeys: 3,
      }),
      weight: 2,
    },
  );
}

export const rawRecordArb: fc.Arbitrary<Record<string, unknown>> =
  fc.dictionary(nestedKeyArb, rawValueArb(3), { maxKeys: 5 });

// ── Data sets ───────────────────────────────────────────────────────────

/** IDs a table can hold. Dangling keys live above it. */
export const ID_MAX = 60;
const DANGLING_BASE = 1000;
const MAX_ROWS = 6;

const idArb = fc.integer({ min: 1, max: ID_MAX });

/** A name over a small alphabet, so substring searches hit and miss. */
export const entityNameArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'abcdeABCDE '), { minLength: 1, maxLength: 6 })
  .map((cs) => cs.join(''));

interface Ref {
  pick: number;
  dangling: boolean;
}

const refArb: fc.Arbitrary<Ref> = fc.record({
  pick: fc.nat({ max: 1_000 }),
  dangling: fc.oneof(
    { arbitrary: fc.constant(false), weight: 9 },
    { arbitrary: fc.constant(true), weight: 1 },
  ),
});

const nullableRefArb: fc.Arbitrary<Ref | null> = fc.oneof(
  { arbitrary: refArb, weight: 3 },
  { arbitrary: fc.constant(null), weight: 1 },
);

function resolve(ref: Ref, parents: readonly number[]): number {
  if (ref.dangling || parents.length === 0) {
    return DANGLING_BASE + (ref.pick % 50);
  }
  return parents[ref.pick % parents.length]!;
}

function resolveNullable(
  ref: Ref | null,
  parents: readonly number[],
): number | null {
  return ref === null ? null : resolve(ref, parents);
}

type Row = Record<string, unknown>;

function table<T extends Row>(
  idField: string,
  fields: { [K in keyof T]: fc.Arbitrary<T[K]> },
): fc.Arbitrary<Array<T & { id: number }>> {
  return fc.uniqueArray(
    fc.record({ id: idArb, ...fields }) as fc.Arbitrary<T & { id: number }>,
    { selector: (row) => row.id, maxLength: MAX_ROWS },
  );
}

const published = fc.boolean();

/** Every family the model exercises, generated independently, keys unresolved. */
const planArb = fc.record({
  categories: table('categoryId', { name: entityNameArb, published }),
  groups: table('groupId', {
    name: entityNameArb,
    category: refArb,
    published,
  }),
  marketGroups: table('marketGroupId', {
    name: entityNameArb,
    parent: nullableRefArb,
  }),
  types: table('typeId', {
    name: entityNameArb,
    group: refArb,
    marketGroup: nullableRefArb,
    published,
  }),
  regions: table('regionId', { name: entityNameArb }),
  constellations: table('constellationId', {
    name: entityNameArb,
    region: refArb,
  }),
  solarSystems: table('systemId', {
    name: entityNameArb,
    constellation: refArb,
    security: fc.double({ min: -1, max: 1, noNaN: true }),
  }),
  stargates: table('stargateId', { system: refArb }),
  stars: table('starId', { system: refArb }),
  planets: table('planetId', { system: refArb }),
  moons: table('moonId', { system: refArb }),
  asteroidBelts: table('asteroidBeltId', { system: refArb }),
  secondarySuns: table('secondarySunId', { system: refArb }),
  agentsInSpace: table('characterId', { system: refArb }),
  factions: table('factionId', { name: entityNameArb }),
  races: table('raceId', { name: entityNameArb }),
  bloodlines: table('bloodlineId', { name: entityNameArb, race: refArb }),
  ancestries: table('ancestryId', { name: entityNameArb, bloodline: refArb }),
  npcCorporations: table('corporationId', {
    name: entityNameArb,
    faction: refArb,
  }),
  npcStations: table('stationId', { system: refArb, owner: refArb }),
  npcCharacters: table('characterId', {
    name: entityNameArb,
    corporation: refArb,
  }),
  dogmaAttributes: table('attributeId', { name: entityNameArb }),
  dogmaEffects: table('effectId', { name: entityNameArb }),
  skins: table('skinId', { internalName: entityNameArb }),
  skinLicenses: table('licenseTypeId', { skin: refArb }),
  metaGroups: table('metaGroupId', { name: entityNameArb }),
  epicArcs: table('epicArcId', { name: entityNameArb }),
  typeDogma: table('typeId', { count: fc.nat({ max: 5 }) }),
});

type Plan = typeof planArb extends fc.Arbitrary<infer T> ? T : never;

function ids(rows: ReadonlyArray<{ id: number }>): number[] {
  return rows.map((r) => r.id);
}

/**
 * A `MemorySdeData` set whose records carry only the fields the lookups
 * read, typed as the provider's data (the memory provider stores what it is
 * given; the SQLite route reads the same fields back from YAML).
 */
export interface SdeDataSet {
  data: MemorySdeData;
  /** The same set, as plain rows per family, for the oracle. */
  rows: Record<Family, Row[]>;
}

export type Family = keyof Plan;

export const FAMILIES: readonly Family[] = [
  'categories',
  'groups',
  'marketGroups',
  'types',
  'regions',
  'constellations',
  'solarSystems',
  'stargates',
  'stars',
  'planets',
  'moons',
  'asteroidBelts',
  'secondarySuns',
  'agentsInSpace',
  'factions',
  'races',
  'bloodlines',
  'ancestries',
  'npcCorporations',
  'npcStations',
  'npcCharacters',
  'dogmaAttributes',
  'dogmaEffects',
  'skins',
  'skinLicenses',
  'metaGroups',
  'epicArcs',
  'typeDogma',
];

/** The ID field of each family, as the provider keys it. */
export const ID_FIELD: Record<Family, string> = {
  categories: 'categoryId',
  groups: 'groupId',
  marketGroups: 'marketGroupId',
  types: 'typeId',
  regions: 'regionId',
  constellations: 'constellationId',
  solarSystems: 'systemId',
  stargates: 'stargateId',
  stars: 'starId',
  planets: 'planetId',
  moons: 'moonId',
  asteroidBelts: 'asteroidBeltId',
  secondarySuns: 'secondarySunId',
  agentsInSpace: 'characterId',
  factions: 'factionId',
  races: 'raceId',
  bloodlines: 'bloodlineId',
  ancestries: 'ancestryId',
  npcCorporations: 'corporationId',
  npcStations: 'stationId',
  npcCharacters: 'characterId',
  dogmaAttributes: 'attributeId',
  dogmaEffects: 'effectId',
  skins: 'skinId',
  skinLicenses: 'licenseTypeId',
  metaGroups: 'metaGroupId',
  epicArcs: 'epicArcId',
  typeDogma: 'typeId',
};

/** The table name each family has in both providers. */
export const TABLE_NAME: Record<Family, string> = {
  categories: 'eve_categories',
  groups: 'eve_groups',
  marketGroups: 'eve_market_groups',
  types: 'eve_types',
  regions: 'eve_regions',
  constellations: 'eve_constellations',
  solarSystems: 'eve_solar_systems',
  stargates: 'eve_stargates',
  stars: 'eve_stars',
  planets: 'eve_planets',
  moons: 'eve_moons',
  asteroidBelts: 'eve_asteroid_belts',
  secondarySuns: 'eve_secondary_suns',
  agentsInSpace: 'eve_agents_in_space',
  factions: 'eve_factions',
  races: 'eve_races',
  bloodlines: 'eve_bloodlines',
  ancestries: 'eve_ancestries',
  npcCorporations: 'eve_npc_corporations',
  npcStations: 'eve_npc_stations',
  npcCharacters: 'eve_npc_characters',
  dogmaAttributes: 'eve_dogma_attributes',
  dogmaEffects: 'eve_dogma_effects',
  skins: 'eve_skins',
  skinLicenses: 'eve_skin_licenses',
  metaGroups: 'eve_meta_groups',
  epicArcs: 'eve_epic_arcs',
  typeDogma: 'eve_type_dogma',
};

function resolvePlan(plan: Plan): Record<Family, Row[]> {
  const categories = ids(plan.categories);
  const groups = ids(plan.groups);
  const marketGroups = ids(plan.marketGroups);
  const regions = ids(plan.regions);
  const constellations = ids(plan.constellations);
  const systems = ids(plan.solarSystems);
  const races = ids(plan.races);
  const bloodlines = ids(plan.bloodlines);
  const factions = ids(plan.factions);
  const corporations = ids(plan.npcCorporations);
  const skins = ids(plan.skins);

  const bySystem = (
    rows: Array<{ id: number; system: Ref }>,
    idField: string,
  ) =>
    rows.map((r) => ({
      [idField]: r.id,
      solarSystemId: resolve(r.system, systems),
    }));

  return {
    categories: plan.categories.map((r) => ({
      categoryId: r.id,
      name: r.name,
      published: r.published,
    })),
    groups: plan.groups.map((r) => ({
      groupId: r.id,
      name: r.name,
      categoryId: resolve(r.category, categories),
      published: r.published,
    })),
    marketGroups: plan.marketGroups.map((r) => ({
      marketGroupId: r.id,
      name: r.name,
      parentGroupId: resolveNullable(r.parent, marketGroups),
    })),
    types: plan.types.map((r) => ({
      typeId: r.id,
      name: r.name,
      groupId: resolve(r.group, groups),
      marketGroupId: resolveNullable(r.marketGroup, marketGroups),
      published: r.published,
    })),
    regions: plan.regions.map((r) => ({ regionId: r.id, name: r.name })),
    constellations: plan.constellations.map((r) => ({
      constellationId: r.id,
      name: r.name,
      regionId: resolve(r.region, regions),
    })),
    solarSystems: plan.solarSystems.map((r) => ({
      systemId: r.id,
      name: r.name,
      constellationId: resolve(r.constellation, constellations),
      security: r.security,
    })),
    stargates: bySystem(plan.stargates, 'stargateId'),
    stars: bySystem(plan.stars, 'starId'),
    planets: bySystem(plan.planets, 'planetId'),
    moons: bySystem(plan.moons, 'moonId'),
    asteroidBelts: bySystem(plan.asteroidBelts, 'asteroidBeltId'),
    secondarySuns: bySystem(plan.secondarySuns, 'secondarySunId'),
    agentsInSpace: bySystem(plan.agentsInSpace, 'characterId'),
    factions: plan.factions.map((r) => ({ factionId: r.id, name: r.name })),
    races: plan.races.map((r) => ({ raceId: r.id, name: r.name })),
    bloodlines: plan.bloodlines.map((r) => ({
      bloodlineId: r.id,
      name: r.name,
      raceId: resolve(r.race, races),
    })),
    ancestries: plan.ancestries.map((r) => ({
      ancestryId: r.id,
      name: r.name,
      bloodlineId: resolve(r.bloodline, bloodlines),
    })),
    npcCorporations: plan.npcCorporations.map((r) => ({
      corporationId: r.id,
      name: r.name,
      factionId: resolve(r.faction, factions),
    })),
    npcStations: plan.npcStations.map((r) => ({
      stationId: r.id,
      solarSystemId: resolve(r.system, systems),
      ownerId: resolve(r.owner, corporations),
    })),
    npcCharacters: plan.npcCharacters.map((r) => ({
      characterId: r.id,
      name: r.name,
      corporationId: resolve(r.corporation, corporations),
    })),
    dogmaAttributes: plan.dogmaAttributes.map((r) => ({
      attributeId: r.id,
      name: r.name,
    })),
    dogmaEffects: plan.dogmaEffects.map((r) => ({
      effectId: r.id,
      name: r.name,
    })),
    skins: plan.skins.map((r) => ({
      skinId: r.id,
      internalName: r.internalName,
    })),
    skinLicenses: plan.skinLicenses.map((r) => ({
      licenseTypeId: r.id,
      skinId: resolve(r.skin, skins),
    })),
    metaGroups: plan.metaGroups.map((r) => ({
      metaGroupId: r.id,
      name: r.name,
    })),
    epicArcs: plan.epicArcs.map((r) => ({ epicArcId: r.id, name: r.name })),
    typeDogma: plan.typeDogma.map((r) => ({
      typeId: r.id,
      dogmaAttributes: Array.from({ length: r.count }, (_, i) => ({
        attributeId: i + 1,
        value: i,
      })),
      dogmaEffects: [],
    })),
  };
}

function describeRows(rows: Record<Family, Row[]>): string {
  const parts = FAMILIES.filter((f) => rows[f].length > 0).map(
    (f) => `${f}[${rows[f].map((r) => JSON.stringify(r)).join(', ')}]`,
  );
  return `{${parts.join(', ')}}`;
}

/** A consistent data set in load order (the order the arrays hold). */
export const sdeDataArb: fc.Arbitrary<SdeDataSet> = planArb.map((plan) => {
  const rows = resolvePlan(plan);
  const data = rows as unknown as MemorySdeData;
  return Object.assign(
    { data, rows },
    { [fc.toStringMethod]: () => describeRows(rows) },
  );
});

/**
 * The same set in the order both providers hold it: every table sorted by
 * ID ascending at load time, so a whole-table or a foreign-key answer comes
 * back in ID order whatever order the records were given in.
 */
export function sortedByIdSet(set: SdeDataSet): SdeDataSet {
  const rows = {} as Record<Family, Row[]>;
  for (const family of FAMILIES) {
    const idField = ID_FIELD[family];
    rows[family] = [...set.rows[family]].sort(
      (a, b) => (a[idField] as number) - (b[idField] as number),
    );
  }
  return { data: rows as unknown as MemorySdeData, rows };
}

/**
 * Write the set as the YAML files `SdeDataProvider.fromDirectory` reads,
 * keyed by ID as CCP's export is. Returns the directory; the caller removes it.
 */
export function writeSdeDirectory(set: SdeDataSet): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-sde-property-'));
  const specByTable = new Map(SDE_FILE_REGISTRY.map((s) => [s.tableName, s]));
  for (const family of FAMILIES) {
    const spec = specByTable.get(TABLE_NAME[family]);
    if (!spec) throw new Error(`No registry entry for ${TABLE_NAME[family]}`);
    const keyed: Record<number, Row> = {};
    for (const row of set.rows[family]) {
      keyed[row[ID_FIELD[family]] as number] = row;
    }
    fs.writeFileSync(path.join(dir, spec.yamlFile), dump(keyed), 'utf-8');
  }
  return dir;
}

// ── Queries and the oracle ──────────────────────────────────────────────

type Lookup =
  | { kind: 'byId'; family: Family }
  | { kind: 'byFk'; family: Family; field: string; parent: Family }
  | { kind: 'firstByFk'; family: Family; field: string; parent: Family }
  | { kind: 'all'; family: Family }
  | { kind: 'search'; family: Family; field: string }
  | { kind: 'roots' };

type Method = keyof IStaticDataProvider;

/** Every provider method the generated families reach, with its meaning. */
export const LOOKUPS: Partial<Record<Method, Lookup>> = {
  getType: { kind: 'byId', family: 'types' },
  getTypesByGroup: {
    kind: 'byFk',
    family: 'types',
    field: 'groupId',
    parent: 'groups',
  },
  getGroup: { kind: 'byId', family: 'groups' },
  getGroupsByCategory: {
    kind: 'byFk',
    family: 'groups',
    field: 'categoryId',
    parent: 'categories',
  },
  getCategory: { kind: 'byId', family: 'categories' },
  getAllCategories: { kind: 'all', family: 'categories' },
  getRegion: { kind: 'byId', family: 'regions' },
  getAllRegions: { kind: 'all', family: 'regions' },
  getConstellation: { kind: 'byId', family: 'constellations' },
  getConstellationsByRegion: {
    kind: 'byFk',
    family: 'constellations',
    field: 'regionId',
    parent: 'regions',
  },
  getSolarSystem: { kind: 'byId', family: 'solarSystems' },
  getSolarSystemsByConstellation: {
    kind: 'byFk',
    family: 'solarSystems',
    field: 'constellationId',
    parent: 'constellations',
  },
  getStargate: { kind: 'byId', family: 'stargates' },
  getStargatesBySystem: {
    kind: 'byFk',
    family: 'stargates',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  searchTypesByName: { kind: 'search', family: 'types', field: 'name' },
  searchSolarSystemsByName: {
    kind: 'search',
    family: 'solarSystems',
    field: 'name',
  },
  getStar: { kind: 'byId', family: 'stars' },
  getStarBySystem: {
    kind: 'firstByFk',
    family: 'stars',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getPlanet: { kind: 'byId', family: 'planets' },
  getPlanetsBySystem: {
    kind: 'byFk',
    family: 'planets',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getMoon: { kind: 'byId', family: 'moons' },
  getMoonsBySystem: {
    kind: 'byFk',
    family: 'moons',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getAsteroidBelt: { kind: 'byId', family: 'asteroidBelts' },
  getAsteroidBeltsBySystem: {
    kind: 'byFk',
    family: 'asteroidBelts',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getFaction: { kind: 'byId', family: 'factions' },
  getAllFactions: { kind: 'all', family: 'factions' },
  getRace: { kind: 'byId', family: 'races' },
  getAllRaces: { kind: 'all', family: 'races' },
  getBloodline: { kind: 'byId', family: 'bloodlines' },
  getBloodlinesByRace: {
    kind: 'byFk',
    family: 'bloodlines',
    field: 'raceId',
    parent: 'races',
  },
  getAncestry: { kind: 'byId', family: 'ancestries' },
  getAncestriesByBloodline: {
    kind: 'byFk',
    family: 'ancestries',
    field: 'bloodlineId',
    parent: 'bloodlines',
  },
  getNpcCorporation: { kind: 'byId', family: 'npcCorporations' },
  getNpcCorporationsByFaction: {
    kind: 'byFk',
    family: 'npcCorporations',
    field: 'factionId',
    parent: 'factions',
  },
  getNpcStation: { kind: 'byId', family: 'npcStations' },
  getNpcStationsBySystem: {
    kind: 'byFk',
    family: 'npcStations',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getNpcStationsByOwner: {
    kind: 'byFk',
    family: 'npcStations',
    field: 'ownerId',
    parent: 'npcCorporations',
  },
  getMarketGroup: { kind: 'byId', family: 'marketGroups' },
  getMarketGroupsByParent: {
    kind: 'byFk',
    family: 'marketGroups',
    field: 'parentGroupId',
    parent: 'marketGroups',
  },
  getRootMarketGroups: { kind: 'roots' },
  getTypesByMarketGroup: {
    kind: 'byFk',
    family: 'types',
    field: 'marketGroupId',
    parent: 'marketGroups',
  },
  searchMarketGroupsByName: {
    kind: 'search',
    family: 'marketGroups',
    field: 'name',
  },
  getMetaGroup: { kind: 'byId', family: 'metaGroups' },
  getAllMetaGroups: { kind: 'all', family: 'metaGroups' },
  getDogmaAttribute: { kind: 'byId', family: 'dogmaAttributes' },
  searchDogmaAttributesByName: {
    kind: 'search',
    family: 'dogmaAttributes',
    field: 'name',
  },
  getDogmaEffect: { kind: 'byId', family: 'dogmaEffects' },
  searchDogmaEffectsByName: {
    kind: 'search',
    family: 'dogmaEffects',
    field: 'name',
  },
  getAgentInSpace: { kind: 'byId', family: 'agentsInSpace' },
  getAgentsInSpaceBySystem: {
    kind: 'byFk',
    family: 'agentsInSpace',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getNpcCharacter: { kind: 'byId', family: 'npcCharacters' },
  getNpcCharactersByCorporation: {
    kind: 'byFk',
    family: 'npcCharacters',
    field: 'corporationId',
    parent: 'npcCorporations',
  },
  searchNpcCharactersByName: {
    kind: 'search',
    family: 'npcCharacters',
    field: 'name',
  },
  getSecondarySun: { kind: 'byId', family: 'secondarySuns' },
  getSecondarySunsBySystem: {
    kind: 'byFk',
    family: 'secondarySuns',
    field: 'solarSystemId',
    parent: 'solarSystems',
  },
  getSkin: { kind: 'byId', family: 'skins' },
  getSkinLicense: { kind: 'byId', family: 'skinLicenses' },
  getSkinLicensesBySkin: {
    kind: 'byFk',
    family: 'skinLicenses',
    field: 'skinId',
    parent: 'skins',
  },
  getTypeDogma: { kind: 'byId', family: 'typeDogma' },
  getEpicArc: { kind: 'byId', family: 'epicArcs' },
  getAllEpicArcs: { kind: 'all', family: 'epicArcs' },
};

const METHODS = Object.keys(LOOKUPS) as Method[];

export type Query =
  | { kind: 'id'; method: Method; id: number }
  | { kind: 'search'; method: Method; query: string; limit: number | undefined }
  | { kind: 'none'; method: Method }
  | { kind: 'entity'; table: string; id: number }
  | { kind: 'entities'; table: string };

const SEARCH_LIMIT_DEFAULT = 25;
const UNKNOWN_TABLE = 'eve_nothing';

function queryToString(q: Query): string {
  switch (q.kind) {
    case 'id':
      return `${q.method}(${q.id})`;
    case 'search': {
      const limit = q.limit === undefined ? '' : `, ${q.limit}`;
      return `${q.method}(${JSON.stringify(q.query)}${limit})`;
    }
    case 'none':
      return `${q.method}()`;
    case 'entity':
      return `getEntity(${JSON.stringify(q.table)}, ${q.id})`;
    case 'entities':
      return `getAllEntities(${JSON.stringify(q.table)})`;
  }
}

/** An ID that usually exists in `family`, sometimes anything. */
function idFor(set: SdeDataSet, family: Family): fc.Arbitrary<number> {
  const existing = set.rows[family].map((r) => r[ID_FIELD[family]] as number);
  const random = fc.integer({ min: 0, max: DANGLING_BASE + 50 });
  if (existing.length === 0) return random;
  return fc.oneof(
    { arbitrary: fc.constantFrom(...existing), weight: 3 },
    { arbitrary: random, weight: 1 },
  );
}

/** A fragment that usually matches some name in `family`, sometimes any text. */
function fragmentFor(
  set: SdeDataSet,
  family: Family,
  field: string,
): fc.Arbitrary<string> {
  const names = set.rows[family]
    .map((r) => r[field])
    .filter((n): n is string => typeof n === 'string' && n.length > 0);
  const random = entityNameArb;
  if (names.length === 0) return random;
  const substring = fc
    .tuple(fc.constantFrom(...names), fc.nat({ max: 5 }), fc.nat({ max: 5 }))
    .map(([name, start, length]) => {
      const from = start % name.length;
      return name.slice(from, from + 1 + length);
    });
  return fc.oneof(
    { arbitrary: substring, weight: 3 },
    { arbitrary: random, weight: 1 },
    { arbitrary: fc.constant(''), weight: 1 },
  );
}

/** One query against a data set. */
export function queryArb(set: SdeDataSet): fc.Arbitrary<Query> {
  const perMethod: fc.Arbitrary<Query>[] = METHODS.map((method) => {
    const lookup = LOOKUPS[method]!;
    switch (lookup.kind) {
      case 'byId':
        return idFor(set, lookup.family).map((id) => ({
          kind: 'id' as const,
          method,
          id,
        }));
      case 'byFk':
      case 'firstByFk':
        return idFor(set, lookup.parent).map((id) => ({
          kind: 'id' as const,
          method,
          id,
        }));
      case 'all':
      case 'roots':
        return fc.constant({ kind: 'none' as const, method });
      case 'search':
        return fc
          .tuple(
            fragmentFor(set, lookup.family, lookup.field),
            fc.option(fc.integer({ min: 1, max: 8 }), { nil: undefined }),
          )
          .map(([query, limit]) => ({
            kind: 'search' as const,
            method,
            query,
            limit,
          }));
    }
  });
  const familyArb = fc.constantFrom(...FAMILIES);
  const tableArb = fc.oneof(
    { arbitrary: familyArb.map((f) => TABLE_NAME[f]), weight: 5 },
    { arbitrary: fc.constant(UNKNOWN_TABLE), weight: 1 },
  );
  const generic: fc.Arbitrary<Query>[] = [
    familyArb.chain((family) =>
      fc
        .tuple(
          fc.oneof(
            { arbitrary: fc.constant(TABLE_NAME[family]), weight: 5 },
            { arbitrary: fc.constant(UNKNOWN_TABLE), weight: 1 },
          ),
          idFor(set, family),
        )
        .map(([table, id]) => ({ kind: 'entity' as const, table, id })),
    ),
    tableArb.map((table) => ({ kind: 'entities' as const, table })),
  ];
  return fc
    .oneof(...perMethod, ...generic)
    .map((q) =>
      Object.assign(q, { [fc.toStringMethod]: () => queryToString(q) }),
    );
}

/** A data set and a sequence of queries against it. */
export const scenarioArb: fc.Arbitrary<{ set: SdeDataSet; queries: Query[] }> =
  sdeDataArb.chain((set) =>
    fc
      .array(queryArb(set), { minLength: 1, maxLength: 40 })
      .map((queries) => ({ set, queries })),
  );

function familyOfTable(table: string): Family | undefined {
  return FAMILIES.find((f) => TABLE_NAME[f] === table);
}

/** The naive answer to `query` over the arrays of `set`. */
export function oracle(set: SdeDataSet, query: Query): unknown {
  if (query.kind === 'entity') {
    const family = familyOfTable(query.table);
    if (!family) return null;
    return (
      set.rows[family].find((r) => r[ID_FIELD[family]] === query.id) ?? null
    );
  }
  if (query.kind === 'entities') {
    const family = familyOfTable(query.table);
    return family ? set.rows[family] : [];
  }
  const lookup = LOOKUPS[query.method]!;
  const id = query.kind === 'id' ? query.id : undefined;
  switch (lookup.kind) {
    case 'byId':
      return (
        set.rows[lookup.family].find(
          (r) => r[ID_FIELD[lookup.family]] === id,
        ) ?? null
      );
    case 'byFk':
      return set.rows[lookup.family].filter((r) => r[lookup.field] === id);
    case 'firstByFk':
      return (
        set.rows[lookup.family].find((r) => r[lookup.field] === id) ?? null
      );
    case 'all':
      return set.rows[lookup.family];
    case 'roots':
      return set.rows.marketGroups.filter((r) => r.parentGroupId === null);
    case 'search': {
      if (query.kind !== 'search') throw new Error('search query expected');
      const needle = query.query.toLowerCase();
      return set.rows[lookup.family]
        .filter((r) => {
          const value = r[lookup.field];
          return (
            typeof value === 'string' && value.toLowerCase().includes(needle)
          );
        })
        .slice(0, query.limit ?? SEARCH_LIMIT_DEFAULT);
    }
  }
}

/** Run `query` against a provider. */
export function ask(provider: IStaticDataProvider, query: Query): unknown {
  switch (query.kind) {
    case 'entity':
      return provider.getEntity(query.table, query.id);
    case 'entities':
      return provider.getAllEntities(query.table);
    case 'id':
      return (provider[query.method] as (id: number) => unknown).call(
        provider,
        query.id,
      );
    case 'search':
      return (
        provider[query.method] as (q: string, limit?: number) => unknown
      ).call(provider, query.query, query.limit);
    case 'none':
      return (provider[query.method] as () => unknown).call(provider);
  }
}

// ── Mutants ─────────────────────────────────────────────────────────────

export type ProviderDefect =
  | 'drops the last record of every list'
  | 'ignores the search limit'
  | 'looks up the ID after the one asked for'
  | 'answers every foreign-key query from the first one';

/** Wrap a real provider in a proxy with one known defect. */
export function mutate(
  provider: IStaticDataProvider,
  defect: ProviderDefect,
): IStaticDataProvider {
  const firstFkAnswer = new Map<string, unknown>();
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;
      if (typeof value !== 'function' || typeof prop !== 'string') return value;
      const method = prop as Method;
      const lookup = LOOKUPS[method];
      return (...args: unknown[]): unknown => {
        const call = (...a: unknown[]) =>
          (value as (...x: unknown[]) => unknown).apply(target, a);
        switch (defect) {
          case 'drops the last record of every list': {
            const result = call(...args);
            return Array.isArray(result) ? result.slice(0, -1) : result;
          }
          case 'ignores the search limit':
            return lookup?.kind === 'search'
              ? call(args[0], Number.MAX_SAFE_INTEGER)
              : call(...args);
          case 'looks up the ID after the one asked for':
            return lookup?.kind === 'byId' && typeof args[0] === 'number'
              ? call(args[0] + 1)
              : call(...args);
          case 'answers every foreign-key query from the first one': {
            if (lookup?.kind !== 'byFk') return call(...args);
            const cached = firstFkAnswer.get(method);
            if (cached !== undefined) return cached;
            const result = call(...args);
            firstFkAnswer.set(method, result);
            return result;
          }
        }
      };
    },
  });
}

// ── Schemas ─────────────────────────────────────────────────────────────

interface ZodDef {
  type: string;
  shape?: Record<string, z.ZodType>;
  innerType?: z.ZodType;
  element?: z.ZodType;
  checks?: Array<{ _zod: { def: { check: string; format?: string } } }>;
}

function defOf(schema: z.ZodType): ZodDef {
  return (schema as unknown as { _zod: { def: ZodDef } })._zod.def;
}

/** The keys of an object schema a record must carry to parse. */
export function requiredKeys(schema: z.ZodType): string[] {
  const def = defOf(schema);
  if (def.type !== 'object' || !def.shape) return [];
  return Object.entries(def.shape)
    .filter(([, value]) => defOf(value).type !== 'optional')
    .map(([key]) => key);
}

const jsonScalarArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer(),
  fc.string({ maxLength: 8 }),
  fc.boolean(),
  fc.constant(null),
);

/** JSON-compatible values up to `depth` levels of arrays and objects. */
function jsonValueArb(depth: number): fc.Arbitrary<unknown> {
  if (depth === 0) return jsonScalarArb;
  const inner = jsonValueArb(depth - 1);
  return fc.oneof(
    { arbitrary: jsonScalarArb, weight: 2 },
    { arbitrary: fc.array(inner, { maxLength: 3 }), weight: 1 },
    {
      arbitrary: fc.dictionary(fc.string({ maxLength: 4 }), inner, {
        maxKeys: 3,
      }),
      weight: 1,
    },
  );
}

/**
 * An arbitrary of values `schema` accepts unchanged, derived from the zod
 * definition. Covers the constructs `src/sde/domain/schemas.ts` uses; any other
 * construct throws so a new one gets a generator rather than a silent gap.
 */
export function schemaArbitrary(schema: z.ZodType): fc.Arbitrary<unknown> {
  const def = defOf(schema);
  switch (def.type) {
    case 'object': {
      const shape = def.shape ?? {};
      const fields: Record<string, fc.Arbitrary<unknown>> = {};
      const optional: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        fields[key] = schemaArbitrary(value);
        if (defOf(value).type === 'optional') optional.push(key);
      }
      return fc.record(fields).map((record) => {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          // An optional key drawn as undefined is left out, as CCP's export
          // leaves it out; zod's output then equals the input.
          if (value === undefined && optional.includes(key)) continue;
          out[key] = value;
        }
        return out;
      });
    }
    case 'number': {
      const isInt = (def.checks ?? []).some(
        (c) => c._zod.def.check === 'number_format',
      );
      return isInt
        ? fc.integer({ min: -1_000_000, max: 1_000_000 })
        : fc.double({ noNaN: true, noDefaultInfinity: true });
    }
    case 'string':
      return fc.string({ maxLength: 12 });
    case 'boolean':
      return fc.boolean();
    case 'array':
      return fc.array(schemaArbitrary(def.element!), { maxLength: 3 });
    case 'optional':
      return fc.option(schemaArbitrary(def.innerType!), { nil: undefined });
    case 'nullable':
      return fc.option(schemaArbitrary(def.innerType!), { nil: null });
    case 'unknown':
      // CCP's payloads under an `unknown` field are scalars, objects and
      // arrays of objects (dogma attribute lists, material lists), nested.
      return jsonValueArb(2);
    default:
      throw new Error(
        `schemaArbitrary: no generator for zod type "${def.type}" (add one in tests/fuzz/support/sde.ts)`,
      );
  }
}
