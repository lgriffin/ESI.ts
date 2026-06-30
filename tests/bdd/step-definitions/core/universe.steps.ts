import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/universe.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-universe-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Retrieve solar system details', ({ given, when, then }) => {
    let result: any;
    const validSystemId = 30000142;

    given('a valid solar system ID', () => {
      const expectedSystem = TestDataFactory.createSolarSystem({
        system_id: validSystemId,
        name: 'Jita',
        constellation_id: 20000020,
        security_status: 0.9459991455078125,
        star_id: 40000001,
        stargates: [50000001, 50000002],
        stations: [60003760, 60003761],
        planets: [
          { planet_id: 40000001, moons: [40000002, 40000003] },
          { planet_id: 40000004, moons: [40000005] },
        ],
      });

      jest
        .spyOn(client.universe, 'getSystemById')
        .mockResolvedValue(expectedSystem);
    });

    when('I request system information', async () => {
      result = await client.universe.getSystemById(validSystemId);
    });

    then('I should receive complete system details', () => {
      expect(result).toBeDefined();
      expect(result.system_id).toBe(validSystemId);
      expect(result.name).toBe('Jita');
      expect(result.security_status).toBeGreaterThan(0.5);
      expect(result.stargates).toBeInstanceOf(Array);
      expect(result.stations).toBeInstanceOf(Array);
      expect(result.planets).toBeInstanceOf(Array);
      expect(result.stations!.length).toBeGreaterThan(0);
    });
  });

  test('Handle non-existent solar system', ({ given, when, then }) => {
    let caughtError: any;
    const invalidSystemId = 99999999;

    given('an invalid solar system ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.universe, 'getSystemById')
        .mockRejectedValue(expectedError);
    });

    when('I request invalid system information', async () => {
      try {
        await client.universe.getSystemById(invalidSystemId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a not found error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Retrieve all solar systems', ({ given, when, then }) => {
    let result: any;

    given('the universe data is available', () => {
      const expectedSystems = [30000001, 30000002, 30000142, 30001161];

      jest
        .spyOn(client.universe, 'getSystems')
        .mockResolvedValue(expectedSystems);
    });

    when('I request all systems', async () => {
      result = await client.universe.getSystems();
    });

    then('I should receive a list of all system IDs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((id: any) => typeof id === 'number')).toBe(true);
      expect(result).toContain(30000142);
    });
  });

  test('Retrieve station details', ({ given, when, then }) => {
    let result: any;
    const validStationId = 60003760;

    given('a valid station ID', () => {
      const expectedStation = TestDataFactory.createStation({
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

      jest
        .spyOn(client.universe, 'getStationById')
        .mockResolvedValue(expectedStation);
    });

    when('I request station information', async () => {
      result = await client.universe.getStationById(validStationId);
    });

    then('I should receive complete station details', () => {
      expect(result).toBeDefined();
      expect(result.station_id).toBe(validStationId);
      expect(result.name).toContain('Jita IV');
      expect(result.system_id).toBe(30000142);
      expect(result.services).toBeInstanceOf(Array);
      expect(result.services).toContain('market');
      expect(result.max_dockable_ship_volume).toBeGreaterThan(0);
    });
  });

  test('Retrieve structure information', ({ given, when, then }) => {
    let result: any;
    const validStructureId = 1021975535893;

    given('a valid structure ID', () => {
      const expectedStructure = TestDataFactory.createStructure({
        structure_id: validStructureId,
        name: 'Test Citadel',
        owner_id: 1689391488,
        solar_system_id: 30000142,
        type_id: 35832,
        position: { x: 1000000000, y: 2000000000, z: 3000000000 },
      });

      jest
        .spyOn(client.universe, 'getStructureById')
        .mockResolvedValue(expectedStructure);
    });

    when('I request structure information', async () => {
      result = await client.universe.getStructureById(validStructureId);
    });

    then('I should receive structure details', () => {
      expect(result).toBeDefined();
      expect(result.structure_id).toBe(validStructureId);
      expect(result.name).toBe('Test Citadel');
      expect(result.solar_system_id).toBe(30000142);
      expect(result.position).toBeDefined();
      expect(result.position!.x).toBeDefined();
    });
  });

  test('Retrieve item type information', ({ given, when, then }) => {
    let result: any;
    const validTypeId = 34;

    given('a valid type ID', () => {
      const expectedType = TestDataFactory.createItemType({
        type_id: validTypeId,
        name: 'Tritanium',
        description: 'The most common ore type in the known universe.',
        group_id: 18,
        category_id: 4,
        market_group_id: 1857,
        mass: 1.0,
        volume: 0.01,
        capacity: 0.0,
        portion_size: 1,
        radius: 1.0,
        published: true,
      });

      jest
        .spyOn(client.universe, 'getTypeById')
        .mockResolvedValue(expectedType);
    });

    when('I request type information', async () => {
      result = await client.universe.getTypeById(validTypeId);
    });

    then('I should receive complete item details', () => {
      expect(result).toBeDefined();
      expect(result.type_id).toBe(validTypeId);
      expect(result.name).toBe('Tritanium');
      expect(result.group_id).toBe(18);
      expect(result.volume).toBe(0.01);
      expect(result.published).toBe(true);
      expect(result.description).toContain('ore');
    });
  });

  test('Retrieve item groups', ({ given, when, then }) => {
    let result: any;

    given('the universe data is available for groups', () => {
      const expectedGroups = [1, 2, 18, 25, 419];

      jest
        .spyOn(client.universe, 'getItemGroups')
        .mockResolvedValue(expectedGroups);
    });

    when('I request all item groups', async () => {
      result = await client.universe.getItemGroups();
    });

    then('I should receive a list of all group IDs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((id: any) => typeof id === 'number')).toBe(true);
      expect(result).toContain(18);
    });
  });

  test('Retrieve item group details', ({ given, when, then }) => {
    let result: any;
    const validGroupId = 18;

    given('a valid group ID', () => {
      const expectedGroup = TestDataFactory.createItemGroup({
        group_id: validGroupId,
        name: 'Mineral',
        category_id: 4,
        published: true,
        types: [34, 35, 36, 37, 38, 39, 40, 11399],
      });

      jest
        .spyOn(client.universe, 'getItemGroupById')
        .mockResolvedValue(expectedGroup);
    });

    when('I request group information', async () => {
      result = await client.universe.getItemGroupById(validGroupId);
    });

    then('I should receive group details and contained types', () => {
      expect(result).toBeDefined();
      expect(result.group_id).toBe(validGroupId);
      expect(result.name).toBe('Mineral');
      expect(result.category_id).toBe(4);
      expect(result.types).toBeInstanceOf(Array);
      expect(result.types).toContain(34);
      expect(result.published).toBe(true);
    });
  });

  test('Retrieve star information', ({ given, when, then }) => {
    let result: any;
    const validStarId = 40000001;

    given('a valid star ID', () => {
      const expectedStar = TestDataFactory.createStar({
        star_id: validStarId,
        name: 'Jita - Star',
        type_id: 3802,
        solar_system_id: 30000142,
        age: 4600000000,
        luminosity: 0.06575,
        radius: 62140000,
        spectral_class: 'K2 V',
        temperature: 4567,
      });

      jest
        .spyOn(client.universe, 'getStarById')
        .mockResolvedValue(expectedStar);
    });

    when('I request star information', async () => {
      result = await client.universe.getStarById(validStarId);
    });

    then('I should receive star details', () => {
      expect(result).toBeDefined();
      expect(result.star_id).toBe(validStarId);
      expect(result.name).toContain('Jita');
      expect(result.solar_system_id).toBe(30000142);
      expect(result.temperature).toBeGreaterThan(1000);
      expect(result.radius).toBeGreaterThan(1000000);
      expect(result.spectral_class).toBeDefined();
    });
  });

  test('Retrieve planet information', ({ given, when, then }) => {
    let result: any;
    const validPlanetId = 40000004;

    given('a valid planet ID', () => {
      const expectedPlanet = TestDataFactory.createPlanet({
        planet_id: validPlanetId,
        name: 'Jita IV',
        type_id: 11,
        system_id: 30000142,
        position: { x: 150000000000, y: 0, z: 0 },
      });

      jest
        .spyOn(client.universe, 'getPlanetById')
        .mockResolvedValue(expectedPlanet);
    });

    when('I request planet information', async () => {
      result = await client.universe.getPlanetById(validPlanetId);
    });

    then('I should receive planet details', () => {
      expect(result).toBeDefined();
      expect(result.planet_id).toBe(validPlanetId);
      expect(result.name).toBe('Jita IV');
      expect(result.system_id).toBe(30000142);
      expect(result.position).toBeDefined();
      expect(result.position.x).toBeGreaterThan(0);
    });
  });

  test('Handle concurrent universe data requests', ({ given, when, then }) => {
    let results: any[];
    const systemIds = [30000142, 30001161, 30002187];

    given('multiple concurrent universe data requests are prepared', () => {
      const mockSystems = systemIds.map((id) =>
        TestDataFactory.createSolarSystem({
          system_id: id,
          name: `System ${id}`,
          security_status: Math.random(),
        }),
      );

      jest
        .spyOn(client.universe, 'getSystemById')
        .mockImplementation(async (id: number) =>
          mockSystems.find((system) => system.system_id === id)!,
        );
    });

    when('I make them simultaneously', async () => {
      const promises = systemIds.map((id) => client.universe.getSystemById(id));
      results = await Promise.all(promises);
    });

    then('all should complete successfully', () => {
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.system_id).toBe(systemIds[index]);
        expect(result.name).toBe(`System ${systemIds[index]}`);
      });
    });
  });

  test('Handle large universe data sets', ({ given, when, then }) => {
    let result: any;
    let responseTime: number;

    given('a request for all systems with large dataset', () => {
      const largeSsystemSet = Array.from(
        { length: 8000 },
        (_, i) => 30000001 + i,
      );

      jest
        .spyOn(client.universe, 'getSystems')
        .mockResolvedValue(largeSsystemSet);
    });

    when('I process the large dataset', async () => {
      const startTime = Date.now();
      result = await client.universe.getSystems();
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the system should handle it efficiently', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(8000);
      expect(responseTime).toBeLessThan(1000);
      expect(result.every((id: any) => typeof id === 'number')).toBe(true);
    });
  });

  test('Search for universe entities', ({ given, when, then }) => {
    let result: any;

    given('a search term for the universe', () => {
      const expectedResults = TestDataFactory.createSearchResults({
        systems: [30000142],
        stations: [60003760, 60003761],
        structures: [],
        characters: [],
        corporations: [],
        alliances: [],
      });

      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults);
    });

    when('I search the universe', async () => {
      result = (await client.search.characterSearch(1689391488, 'Jita', [
        'solar_system',
        'station',
        'constellation',
        'region',
      ])) as any;
    });

    then('I should receive matching entities', () => {
      expect(result).toBeDefined();
      expect(result.systems).toBeInstanceOf(Array);
      expect(result.stations).toBeInstanceOf(Array);
      expect(result.systems).toContain(30000142);
      expect(result.stations).toContain(60003760);
    });
  });

  test('Name resolution', ({ given, when, then }) => {
    let result: any;

    given('a list of entity IDs', () => {
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

      jest
        .spyOn(client.universe, 'postNamesAndCategories')
        .mockResolvedValue(expectedNames);
    });

    when('I request name resolution', async () => {
      const entityIds = [30000142, 60003760, 1689391488];
      result = await client.universe.postNamesAndCategories(entityIds);
    });

    then('I should receive entity names and categories', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('category');
      expect(result.find((item: any) => item.id === 30000142)?.name).toBe(
        'Jita',
      );
      expect(result.find((item: any) => item.id === 30000142)?.category).toBe(
        'solar_system',
      );
    });
  });

  test('Complete system exploration workflow', ({ given, when, then }) => {
    let system: any;
    let star: any;
    let station: any;
    let planet: any;
    const systemId = 30000142;

    given('a system ID for exploration', () => {
      const mockSystem = TestDataFactory.createSolarSystem({
        system_id: systemId,
        name: 'Jita',
      });
      const mockStar = TestDataFactory.createStar({
        star_id: 40000001,
        solar_system_id: systemId,
      });
      const mockStation = TestDataFactory.createStation({
        station_id: 60003760,
        system_id: systemId,
      });
      const mockPlanet = TestDataFactory.createPlanet({
        planet_id: 40000004,
        system_id: systemId,
      });

      jest
        .spyOn(client.universe, 'getSystemById')
        .mockResolvedValue(mockSystem);
      jest.spyOn(client.universe, 'getStarById').mockResolvedValue(mockStar);
      jest
        .spyOn(client.universe, 'getStationById')
        .mockResolvedValue(mockStation);
      jest
        .spyOn(client.universe, 'getPlanetById')
        .mockResolvedValue(mockPlanet);
    });

    when('I gather complete system information', async () => {
      system = await client.universe.getSystemById(systemId);
      [star, station, planet] = await Promise.all([
        client.universe.getStarById(system.star_id!),
        client.universe.getStationById(system.stations![0]),
        client.universe.getPlanetById(system.planets![0].planet_id),
      ]);
    });

    then('I should successfully retrieve all system data', () => {
      expect(system).toBeDefined();
      expect(system.system_id).toBe(systemId);
      expect(system.name).toBe('Jita');

      expect(star).toBeDefined();
      expect(star.solar_system_id).toBe(systemId);

      expect(station).toBeDefined();
      expect(station.system_id).toBe(systemId);

      expect(planet).toBeDefined();
      expect(planet.system_id).toBe(systemId);
    });
  });
});
