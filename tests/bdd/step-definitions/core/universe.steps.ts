import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0036-universe.feature');

/** Matches exactly `/<resource>` (optionally `/<resource>/`), not its children. */
function exactPath(resource: string): RegExp {
  return new RegExp(`/${resource}/?(\\?|$)`);
}

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

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Jita returns its name, security status, and celestial identifier arrays', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validSystemId = 30000142;
    const expectedSystem = TestDataFactory.createSolarSystem({
      system_id: validSystemId,
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
    });

    given('a valid solar system ID', () => {
      queueResponse({
        match: exactPath(`universe/systems/${validSystemId}`),
        body: expectedSystem,
      });
    });

    when('the client requests system information', async () => {
      result = await client.universe.getSystemById(validSystemId);
    });

    then('the client shall return complete system details', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        exactPath(`universe/systems/${validSystemId}`),
      );
      expect(result).toEqual(expectedSystem);
      expect(result.name).toBe('Jita');
      expect(result.security_status).toBe(0.9459991455078125);
      expect(result.stargates).toEqual([50000001, 50000002]);
      expect(result.stations).toEqual([60003760, 60003761]);
      expect(result.planets.map((p: any) => p.planet_id)).toEqual([
        40000001, 40000004,
      ]);
    });
  });

  test('Unknown system identifier rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const invalidSystemId = 99999999;

    given('an invalid solar system ID', () => {
      queueError(404, 'Solar system not found', {
        match: exactPath(`universe/systems/${invalidSystemId}`),
      });
    });

    when('the client requests invalid system information', async () => {
      try {
        await client.universe.getSystemById(invalidSystemId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a not found error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      // 404 is not retryable: one request, one rejection.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('System index returns numeric system identifiers', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedSystems = [30000001, 30000002, 30000142, 30001161];

    given('the universe data is available', () => {
      queueResponse({
        match: exactPath('universe/systems'),
        body: expectedSystems,
      });
    });

    when('the client requests all systems', async () => {
      result = await client.universe.getSystems();
    });

    then('the client shall return a list of all system IDs', () => {
      expect(lastRequest().url.pathname).toMatch(exactPath('universe/systems'));
      expect(result).toEqual(expectedSystems);
      expect(result.every((id: unknown) => typeof id === 'number')).toBe(true);
    });
  });

  test('Station returns its host system and service list', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validStationId = 60003760;
    const expectedStation = stationRecord({
      station_id: validStationId,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      owner: 1000035,
      type_id: 52678,
      race_id: 1,
      system_id: 30000142,
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
    });

    given('a valid station ID', () => {
      queueResponse({
        match: exactPath(`universe/stations/${validStationId}`),
        body: expectedStation,
      });
    });

    when('the client requests station information', async () => {
      result = await client.universe.getStationById(validStationId);
    });

    then('the client shall return complete station details', () => {
      expect(lastRequest().url.pathname).toMatch(
        exactPath(`universe/stations/${validStationId}`),
      );
      expect(result).toEqual(expectedStation);
      expect(result.name).toBe(
        'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      );
      expect(result.system_id).toBe(30000142);
      expect(result.services).toEqual([
        'bounty-missions',
        'courier-missions',
        'interbus',
        'reprocessing-plant',
        'market',
        'stock-exchange',
      ]);
      expect(result.max_dockable_ship_volume).toBe(50000000);
    });
  });

  test('Structure returns its host system and position vector', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validStructureId = 1021975535893;
    const expectedStructure = structureRecord({
      name: 'Test Citadel',
      owner_id: 1689391488,
      solar_system_id: 30000142,
      type_id: 35832,
      position: { x: 1000000000, y: 2000000000, z: 3000000000 },
    });

    given('a valid structure ID', () => {
      queueResponse({
        match: exactPath(`universe/structures/${validStructureId}`),
        body: expectedStructure,
      });
    });

    when('the client requests structure information', async () => {
      result = await client.universe.getStructureById(validStructureId);
    });

    then('the client shall return structure details', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        exactPath(`universe/structures/${validStructureId}`),
      );
      // Structure lookups need a docking-access token.
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedStructure);
      expect(result.name).toBe('Test Citadel');
      expect(result.solar_system_id).toBe(30000142);
      expect(result.position).toEqual({
        x: 1000000000,
        y: 2000000000,
        z: 3000000000,
      });
    });
  });

  test('Tritanium returns its group, volume, and published flag', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validTypeId = 34;
    const expectedType = TestDataFactory.createItemType({
      type_id: validTypeId,
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
    });

    given('a valid type ID', () => {
      queueResponse({
        match: exactPath(`universe/types/${validTypeId}`),
        body: expectedType,
      });
    });

    when('the client requests type information', async () => {
      result = await client.universe.getTypeById(validTypeId);
    });

    then('the client shall return complete item details', () => {
      expect(lastRequest().url.pathname).toMatch(
        exactPath(`universe/types/${validTypeId}`),
      );
      expect(result).toEqual(expectedType);
      expect(result.name).toBe('Tritanium');
      expect(result.description).toBe(
        'The most common ore type in the known universe.',
      );
      expect(result.group_id).toBe(18);
      expect(result.volume).toBe(0.01);
      expect(result.published).toBe(true);
    });
  });

  test('Item group index returns numeric group identifiers', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedGroups = [1, 2, 18, 25, 419];

    given('the universe data is available for groups', () => {
      queueResponse({
        match: exactPath('universe/groups'),
        body: expectedGroups,
      });
    });

    when('the client requests all item groups', async () => {
      result = await client.universe.getItemGroups();
    });

    then('the client shall return a list of all group IDs', () => {
      expect(lastRequest().url.pathname).toMatch(exactPath('universe/groups'));
      expect(result).toEqual(expectedGroups);
      expect(result.every((id: unknown) => typeof id === 'number')).toBe(true);
    });
  });

  test('Mineral group returns its category and contained type identifiers', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validGroupId = 18;
    const expectedGroup = TestDataFactory.createItemGroup({
      group_id: validGroupId,
      name: 'Mineral',
      category_id: 4,
      published: true,
      types: [34, 35, 36, 37, 38, 39, 40, 11399],
    });

    given('a valid group ID', () => {
      queueResponse({
        match: exactPath(`universe/groups/${validGroupId}`),
        body: expectedGroup,
      });
    });

    when('the client requests group information', async () => {
      result = await client.universe.getItemGroupById(validGroupId);
    });

    then('the client shall return group details and contained types', () => {
      expect(lastRequest().url.pathname).toMatch(
        exactPath(`universe/groups/${validGroupId}`),
      );
      expect(result).toEqual(expectedGroup);
      expect(result.name).toBe('Mineral');
      expect(result.category_id).toBe(4);
      expect(result.types).toEqual([34, 35, 36, 37, 38, 39, 40, 11399]);
    });
  });

  test('Star returns its spectral class, temperature, and radius', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validStarId = 40000001;
    const expectedStar = starRecord({
      name: 'Jita - Star',
      type_id: 3802,
      solar_system_id: 30000142,
      age: 4600000000,
      luminosity: 0.06575,
      radius: 62140000,
      spectral_class: 'K2 V',
      temperature: 4567,
    });

    given('a valid star ID', () => {
      queueResponse({
        match: exactPath(`universe/stars/${validStarId}`),
        body: expectedStar,
      });
    });

    when('the client requests star information', async () => {
      result = await client.universe.getStarById(validStarId);
    });

    then('the client shall return star details', () => {
      expect(lastRequest().url.pathname).toMatch(
        exactPath(`universe/stars/${validStarId}`),
      );
      expect(result).toEqual(expectedStar);
      expect(result.name).toBe('Jita - Star');
      expect(result.solar_system_id).toBe(30000142);
      expect(result.spectral_class).toBe('K2 V');
      expect(result.temperature).toBe(4567);
      expect(result.radius).toBe(62140000);
    });
  });

  test('Planet returns its host system and position', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validPlanetId = 40000004;
    const expectedPlanet = TestDataFactory.createPlanet({
      planet_id: validPlanetId,
      name: 'Jita IV',
      type_id: 11,
      system_id: 30000142,
      position: { x: 150000000000, y: 0, z: 0 },
    });

    given('a valid planet ID', () => {
      queueResponse({
        match: exactPath(`universe/planets/${validPlanetId}`),
        body: expectedPlanet,
      });
    });

    when('the client requests planet information', async () => {
      result = await client.universe.getPlanetById(validPlanetId);
    });

    then('the client shall return planet details', () => {
      expect(lastRequest().url.pathname).toMatch(
        exactPath(`universe/planets/${validPlanetId}`),
      );
      expect(result).toEqual(expectedPlanet);
      expect(result.name).toBe('Jita IV');
      expect(result.system_id).toBe(30000142);
      expect(result.position).toEqual({ x: 150000000000, y: 0, z: 0 });
    });
  });

  test('Three concurrent system lookups each return their own system', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    const systemIds = [30000142, 30001161, 30002187];

    given('multiple concurrent universe data requests are prepared', () => {
      systemIds.forEach((id, index) => {
        queueResponse({
          match: exactPath(`universe/systems/${id}`),
          body: TestDataFactory.createSolarSystem({
            system_id: id,
            name: `System ${id}`,
            position: JITA_POSITION,
            security_status: 0.5 + index * 0.1,
          }),
          // The first request is answered last, so pairing responses by
          // arrival order instead of by identifier would be caught.
          delayMs: (systemIds.length - index) * 10,
        });
      });
    });

    when('the client makes them simultaneously', async () => {
      const promises = systemIds.map((id) => client.universe.getSystemById(id));
      results = await Promise.all(promises);
    });

    then('all requests shall complete successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(results.map((r) => r.system_id)).toEqual(systemIds);
      expect(results.map((r) => r.name)).toEqual(
        systemIds.map((id) => `System ${id}`),
      );
    });
  });

  test('Index of 8000 systems resolves within the time bound', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    let responseTime: number;
    const largeSystemSet = Array.from({ length: 8000 }, (_, i) => 30000001 + i);

    given('a request for all systems with large dataset', () => {
      queueResponse({
        match: exactPath('universe/systems'),
        body: largeSystemSet,
      });
    });

    when('the client processes the large dataset', async () => {
      const startTime = Date.now();
      result = await client.universe.getSystems();
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the client shall handle it efficiently', () => {
      expect(result).toHaveLength(8000);
      expect(result).toEqual(largeSystemSet);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  test('Search for Jita returns matching system and station identifiers', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;
    // ESI keys search results by the singular category names it was asked for,
    // and omits categories with no hits.
    const expectedResults = {
      solar_system: [30000142],
      station: [60003760, 60003761],
    };

    given('a search term for the universe', () => {
      queueResponse({
        match: `/characters/${characterId}/search`,
        body: expectedResults,
      });
    });

    when('the client searches the universe', async () => {
      result = (await client.search.characterSearch(characterId, 'Jita', [
        'solar_system',
        'station',
        'constellation',
        'region',
      ])) as any;
    });

    then('the client shall return matching entities', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        exactPath(`characters/${characterId}/search`),
      );
      expect(request.url.searchParams.get('search')).toBe('Jita');
      expect(request.url.searchParams.get('categories')).toBe(
        'solar_system,station,constellation,region',
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedResults);
      expect(result.solar_system).toEqual([30000142]);
      expect(result.station).toEqual([60003760, 60003761]);
    });
  });

  test('Mixed identifier list resolves to names with categories', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const entityIds = [30000142, 60003760, 1689391488];
    const expectedNames = [
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
    ];

    given('a list of entity IDs', () => {
      queueResponse({
        match: exactPath('universe/names'),
        body: expectedNames,
      });
    });

    when('the client requests name resolution', async () => {
      result = await client.universe.postNamesAndCategories(entityIds);
    });

    then('the client shall return entity names and categories', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toMatch(exactPath('universe/names'));
      expect(JSON.parse(request.body ?? 'null')).toEqual(entityIds);
      expect(result).toEqual(expectedNames);
      expect(result.map((e: any) => [e.id, e.name, e.category])).toEqual([
        [30000142, 'Jita', 'solar_system'],
        [60003760, 'Jita IV - Moon 4 - Caldari Navy Assembly Plant', 'station'],
        [1689391488, 'Test Character', 'character'],
      ]);
    });
  });

  test('System lookup chained into star, station, and planet lookups', ({
    given,
    when,
    then,
  }) => {
    let system: any;
    let star: any;
    let station: any;
    let planet: any;
    const systemId = 30000142;
    const starId = 40009076;
    const stationId = 60003760;
    const planetId = 40009077;

    given('a system ID for exploration', () => {
      queueResponse({
        match: exactPath(`universe/systems/${systemId}`),
        body: TestDataFactory.createSolarSystem({
          system_id: systemId,
          name: 'Jita',
          position: JITA_POSITION,
          star_id: starId,
          stations: [stationId, 60003761],
          planets: [{ planet_id: planetId }, { planet_id: 40009078 }],
        }),
      });
      queueResponse({
        match: exactPath(`universe/stars/${starId}`),
        body: starRecord({ solar_system_id: systemId }),
      });
      queueResponse({
        match: exactPath(`universe/stations/${stationId}`),
        body: stationRecord({ station_id: stationId, system_id: systemId }),
      });
      queueResponse({
        match: exactPath(`universe/planets/${planetId}`),
        body: TestDataFactory.createPlanet({
          planet_id: planetId,
          system_id: systemId,
        }),
      });
    });

    when('the client gathers complete system information', async () => {
      system = await client.universe.getSystemById(systemId);
      [star, station, planet] = await Promise.all([
        client.universe.getStarById(system.star_id!),
        client.universe.getStationById(system.stations![0]),
        client.universe.getPlanetById(system.planets![0].planet_id),
      ]);
    });

    then('the client shall successfully retrieve all system data', () => {
      const paths = sentRequests().map((r) => r.url.pathname);
      expect(paths).toHaveLength(4);
      expect(paths[0]).toMatch(exactPath(`universe/systems/${systemId}`));
      // The follow-up lookups use the identifiers read from the system record.
      expect(paths.slice(1)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(exactPath(`universe/stars/${starId}`)),
          expect.stringMatching(exactPath(`universe/stations/${stationId}`)),
          expect.stringMatching(exactPath(`universe/planets/${planetId}`)),
        ]),
      );

      expect(system.system_id).toBe(systemId);
      expect(system.name).toBe('Jita');
      expect(star.solar_system_id).toBe(systemId);
      expect(station.station_id).toBe(stationId);
      expect(station.system_id).toBe(systemId);
      expect(planet.planet_id).toBe(planetId);
      expect(planet.system_id).toBe(systemId);
    });
  });
});
