/**
 * What ESI's universe endpoints send back in 0036-universe.feature, and
 * where. Step files queue these; they do not build payloads or URLs themselves.
 */
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

export const JITA = 30000142;
export const UNKNOWN_SYSTEM_ID = 99999999;
export const JITA_STATION_ID = 60003760;
export const CITADEL_ID = 1021975535893;
export const JITA_STAR_ID = 40000001;
export const JITA_IV_ID = 40000004;
export const TRITANIUM_TYPE_ID = 34;
export const MINERAL_GROUP_ID = 18;
export const SEARCH_CHARACTER_ID = 1689391488;
export const SEARCH_TERM = 'Jita';
export const SEARCH_CATEGORIES = [
  'solar_system',
  'station',
  'constellation',
  'region',
] as const;
export const ENTITY_IDS = [30000142, 60003760, 1689391488];

/** Systems looked up concurrently, in request order. */
export const CONCURRENT_SYSTEM_IDS = [30000142, 30001161, 30002187];

export const LARGE_INDEX_SIZE = 8000;

/** The identifiers the system exploration chain follows. */
export const EXPLORATION = {
  systemId: JITA,
  starId: 40009076,
  stationId: 60003760,
  planetId: 40009077,
};

/** Matches exactly `/<resource>` (optionally `/<resource>/`), not its children. */
export function exactPath(resource: string): RegExp {
  return new RegExp(`/${resource}/?(\\?|$)`);
}

export const universeMatches = {
  systems: () => exactPath('universe/systems'),
  system: (id: number) => exactPath(`universe/systems/${id}`),
  groups: () => exactPath('universe/groups'),
  group: (id: number) => exactPath(`universe/groups/${id}`),
  station: (id: number) => exactPath(`universe/stations/${id}`),
  structure: (id: number) => exactPath(`universe/structures/${id}`),
  star: (id: number) => exactPath(`universe/stars/${id}`),
  planet: (id: number) => exactPath(`universe/planets/${id}`),
  type: (id: number) => exactPath(`universe/types/${id}`),
  names: () => exactPath('universe/names'),
  characterSearch: (characterId: number) =>
    exactPath(`characters/${characterId}/search`),
};

export const universePaths = {
  characterSearch: (characterId: number) => `/characters/${characterId}/search`,
};

const JITA_POSITION = {
  x: -129064861735000000,
  y: 60755306910000000,
  z: 117469227060000000,
};

/** Station records as ESI sends them: position is required. */
function stationRecord(overrides: Record<string, unknown> = {}) {
  return TestDataFactory.createStation({
    position: { x: 3813196800, y: 1016750000, z: -2305570000 },
    ...overrides,
  });
}

/** Star records as ESI sends them: no star_id in the body. */
function starRecord(overrides: Record<string, unknown> = {}) {
  const { star_id: _omitted, ...record } = TestDataFactory.createStar();
  return { ...record, ...overrides };
}

/** Structure records as ESI sends them: no structure_id in the body. */
function structureRecord(overrides: Record<string, unknown> = {}) {
  const { structure_id: _omitted, ...record } =
    TestDataFactory.createStructure();
  return { ...record, ...overrides };
}

export const universeFixtures = {
  jita: () =>
    TestDataFactory.createSolarSystem({
      system_id: JITA,
      name: 'Jita',
      constellation_id: 20000020,
      position: JITA_POSITION,
      security_class: 'B',
      security_status: 0.9459991455078125,
      star_id: 40000001,
      stargates: [50000001, 50000002],
      stations: [60003760, 60003761],
      planets: [
        { planet_id: 40000001, moons: [40000002, 40000003] },
        { planet_id: 40000004, moons: [40000005] },
      ],
    }),

  systemIndex: () => [30000001, 30000002, 30000142, 30001161],

  groupIndex: () => [1, 2, 18, 25, 419],

  largeSystemIndex: () =>
    Array.from({ length: LARGE_INDEX_SIZE }, (_, i) => 30000001 + i),

  jitaStation: () =>
    stationRecord({
      station_id: JITA_STATION_ID,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      owner: 1000035,
      type_id: 52678,
      race_id: 1,
      system_id: JITA,
      reprocessing_efficiency: 0.5,
      reprocessing_stations_take: 0.05,
      max_dockable_ship_volume: 50000000,
      office_rental_cost: 10000000,
      services: [
        'bounty-missions',
        'courier-missions',
        'interbus',
        'reprocessing-plant',
        'market',
        'stock-exchange',
      ],
    }),

  citadel: () =>
    structureRecord({
      name: 'Test Citadel',
      owner_id: 1689391488,
      solar_system_id: JITA,
      type_id: 35832,
      position: { x: 1000000000, y: 2000000000, z: 3000000000 },
    }),

  tritanium: () =>
    TestDataFactory.createItemType({
      type_id: TRITANIUM_TYPE_ID,
      name: 'Tritanium',
      description: 'The most common ore type in the known universe.',
      group_id: 18,
      market_group_id: 1857,
      mass: 1.0,
      volume: 0.01,
      packaged_volume: 0.01,
      capacity: 0.0,
      portion_size: 1,
      radius: 1.0,
      published: true,
    }),

  mineralGroup: () =>
    TestDataFactory.createItemGroup({
      group_id: MINERAL_GROUP_ID,
      name: 'Mineral',
      category_id: 4,
      published: true,
      types: [34, 35, 36, 37, 38, 39, 40, 11399],
    }),

  jitaStar: () =>
    starRecord({
      name: 'Jita - Star',
      type_id: 3802,
      solar_system_id: JITA,
      age: 4600000000,
      luminosity: 0.06575,
      radius: 62140000,
      spectral_class: 'K2 V',
      temperature: 4567,
    }),

  jitaIV: () =>
    TestDataFactory.createPlanet({
      planet_id: JITA_IV_ID,
      name: 'Jita IV',
      type_id: 11,
      system_id: JITA,
      position: { x: 150000000000, y: 0, z: 0 },
    }),

  /** One system per concurrent lookup, named after its identifier. */
  concurrentSystem: (id: number, position: number) =>
    TestDataFactory.createSolarSystem({
      system_id: id,
      name: `System ${id}`,
      position: JITA_POSITION,
      security_status: 0.5 + position * 0.1,
    }),

  /** ESI keys search results by the singular category names it was asked for, and omits categories with no hits. */
  searchResults: () => ({
    solar_system: [30000142],
    station: [60003760, 60003761],
  }),

  entityNames: () => [
    TestDataFactory.createEntityName({
      id: 30000142,
      name: 'Jita',
      category: 'solar_system',
    }),
    TestDataFactory.createEntityName({
      id: 60003760,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      category: 'station',
    }),
    TestDataFactory.createEntityName({
      id: 1689391488,
      name: 'Test Character',
      category: 'character',
    }),
  ],

  explorationSystem: () =>
    TestDataFactory.createSolarSystem({
      system_id: EXPLORATION.systemId,
      name: 'Jita',
      position: JITA_POSITION,
      star_id: EXPLORATION.starId,
      stations: [EXPLORATION.stationId, 60003761],
      planets: [{ planet_id: EXPLORATION.planetId }, { planet_id: 40009078 }],
    }),

  explorationStar: () => starRecord({ solar_system_id: EXPLORATION.systemId }),

  explorationStation: () =>
    stationRecord({
      station_id: EXPLORATION.stationId,
      system_id: EXPLORATION.systemId,
    }),

  explorationPlanet: () =>
    TestDataFactory.createPlanet({
      planet_id: EXPLORATION.planetId,
      system_id: EXPLORATION.systemId,
    }),
};
