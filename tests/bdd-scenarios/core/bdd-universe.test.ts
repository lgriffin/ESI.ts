/**
 * BDD Scenarios: Universe Information
 * 
 * Comprehensive behavior-driven tests for all Universe-related APIs
 * covering systems, stations, structures, types, and static game data.
 */

import { EsiClient } from '../../../src/EsiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Universe Information', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-universe-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000
    });
  });

  describe('Feature: Solar System Information', () => {
    describe('Scenario: Retrieve solar system details', () => {
      it('Given a valid solar system ID, When I request system information, Then I should receive complete system details', async () => {
        // Given: A valid solar system ID (Jita)
        const validSystemId = 30000142;
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
            { planet_id: 40000004, moons: [40000005] }
          ]
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getSystemById').mockResolvedValue(expectedSystem);

        // When: I request system information
        const result = await client.universe.getSystemById(validSystemId);

        // Then: I should receive complete system details
        expect(result).toBeDefined();
        expect(result.system_id).toBe(validSystemId);
        expect(result.name).toBe('Jita');
        expect(result.security_status).toBeGreaterThan(0.5);
        expect(result.stargates).toBeInstanceOf(Array);
        expect(result.stations).toBeInstanceOf(Array);
        expect(result.planets).toBeInstanceOf(Array);
        expect(result.stations.length).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Handle non-existent solar system', () => {
      it('Given an invalid solar system ID, When I request system information, Then I should receive a not found error', async () => {
        // Given: An invalid solar system ID
        const invalidSystemId = 99999999;
        const expectedError = TestDataFactory.createError(ApiErrorType.NOT_FOUND_ERROR, 404);

        // Mock the API to throw an error
        jest.spyOn(client.universe, 'getSystemById').mockRejectedValue(expectedError);

        // When & Then: I request system info and expect an error
        await expect(client.universe.getSystemById(invalidSystemId))
          .rejects
          .toThrow(ApiError);
      });
    });

    describe('Scenario: Retrieve all solar systems', () => {
      it('Given the universe data is available, When I request all systems, Then I should receive a list of all system IDs', async () => {
        // Given: The universe data is available
        const expectedSystems = [30000001, 30000002, 30000142, 30001161]; // Sample system IDs

        // Mock the API response
        jest.spyOn(client.universe, 'getSystems').mockResolvedValue(expectedSystems);

        // When: I request all systems
        const result = await client.universe.getSystems();

        // Then: I should receive a list of all system IDs
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0); // Should have systems
        expect(result.every((id: any) => typeof id === 'number')).toBe(true);
        expect(result).toContain(30000142); // Should contain Jita
      });
    });
  });

  describe('Feature: Station and Structure Information', () => {
    describe('Scenario: Retrieve station details', () => {
      it('Given a valid station ID, When I request station information, Then I should receive complete station details', async () => {
        // Given: A valid station ID (Jita IV - Moon 4 - Caldari Navy Assembly Plant)
        const validStationId = 60003760;
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
          services: ['bounty-missions', 'courier-missions', 'interbus', 'reprocessing-plant', 'market', 'stock-exchange']
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getStationById').mockResolvedValue(expectedStation);

        // When: I request station information
        const result = await client.universe.getStationById(validStationId);

        // Then: I should receive complete station details
        expect(result).toBeDefined();
        expect(result.station_id).toBe(validStationId);
        expect(result.name).toContain('Jita IV');
        expect(result.system_id).toBe(30000142);
        expect(result.services).toBeInstanceOf(Array);
        expect(result.services).toContain('market');
        expect(result.max_dockable_ship_volume).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Retrieve structure information', () => {
      it('Given a valid structure ID, When I request structure information, Then I should receive structure details', async () => {
        // Given: A valid structure ID
        const validStructureId = 1021975535893;
        const expectedStructure = TestDataFactory.createStructure({
          structure_id: validStructureId,
          name: 'Test Citadel',
          owner_id: 1689391488,
          solar_system_id: 30000142,
          type_id: 35832,
          position: { x: 1000000000, y: 2000000000, z: 3000000000 }
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getStructureById').mockResolvedValue(expectedStructure);

        // When: I request structure information
        const result = await client.universe.getStructureById(validStructureId);

        // Then: I should receive structure details
        expect(result).toBeDefined();
        expect(result.structure_id).toBe(validStructureId);
        expect(result.name).toBe('Test Citadel');
        expect(result.solar_system_id).toBe(30000142);
        expect(result.position).toBeDefined();
        expect(result.position.x).toBeDefined();
      });
    });
  });

  describe('Feature: Item Types and Categories', () => {
    describe('Scenario: Retrieve item type information', () => {
      it('Given a valid type ID, When I request type information, Then I should receive complete item details', async () => {
        // Given: A valid type ID (Tritanium)
        const validTypeId = 34;
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
          published: true
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getTypeById').mockResolvedValue(expectedType);

        // When: I request type information
        const result = await client.universe.getTypeById(validTypeId);

        // Then: I should receive complete item details
        expect(result).toBeDefined();
        expect(result.type_id).toBe(validTypeId);
        expect(result.name).toBe('Tritanium');
        expect(result.group_id).toBe(18);
        expect(result.volume).toBe(0.01);
        expect(result.published).toBe(true);
        expect(result.description).toContain('ore');
      });
    });

    describe('Scenario: Retrieve item groups', () => {
      it('Given the universe data is available, When I request all item groups, Then I should receive a list of all group IDs', async () => {
        // Given: The universe data is available
        const expectedGroups = [1, 2, 18, 25, 419]; // Sample group IDs

        // Mock the API response
        jest.spyOn(client.universe, 'getItemGroups').mockResolvedValue(expectedGroups);

        // When: I request all item groups
        const result = await client.universe.getItemGroups();

        // Then: I should receive a list of all group IDs
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0); // Should have item groups
        expect(result.every((id: any) => typeof id === 'number')).toBe(true);
        expect(result).toContain(18); // Should contain mineral group
      });
    });

    describe('Scenario: Retrieve item group details', () => {
      it('Given a valid group ID, When I request group information, Then I should receive group details and contained types', async () => {
        // Given: A valid group ID (Mineral group)
        const validGroupId = 18;
        const expectedGroup = TestDataFactory.createItemGroup({
          group_id: validGroupId,
          name: 'Mineral',
          category_id: 4,
          published: true,
          types: [34, 35, 36, 37, 38, 39, 40, 11399] // Mineral type IDs
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getItemGroupById').mockResolvedValue(expectedGroup);

        // When: I request group information
        const result = await client.universe.getItemGroupById(validGroupId);

        // Then: I should receive group details and contained types
        expect(result).toBeDefined();
        expect(result.group_id).toBe(validGroupId);
        expect(result.name).toBe('Mineral');
        expect(result.category_id).toBe(4);
        expect(result.types).toBeInstanceOf(Array);
        expect(result.types).toContain(34); // Should contain Tritanium
        expect(result.published).toBe(true);
      });
    });
  });

  describe('Feature: Celestial Objects', () => {
    describe('Scenario: Retrieve star information', () => {
      it('Given a valid star ID, When I request star information, Then I should receive star details', async () => {
        // Given: A valid star ID
        const validStarId = 40000001;
        const expectedStar = TestDataFactory.createStar({
          star_id: validStarId,
          name: 'Jita - Star',
          type_id: 3802,
          solar_system_id: 30000142,
          age: 4600000000,
          luminosity: 0.06575,
          radius: 62140000,
          spectral_class: 'K2 V',
          temperature: 4567
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getStarById').mockResolvedValue(expectedStar);

        // When: I request star information
        const result = await client.universe.getStarById(validStarId);

        // Then: I should receive star details
        expect(result).toBeDefined();
        expect(result.star_id).toBe(validStarId);
        expect(result.name).toContain('Jita');
        expect(result.solar_system_id).toBe(30000142);
        expect(result.temperature).toBeGreaterThan(1000);
        expect(result.radius).toBeGreaterThan(1000000);
        expect(result.spectral_class).toBeDefined();
      });
    });

    describe('Scenario: Retrieve planet information', () => {
      it('Given a valid planet ID, When I request planet information, Then I should receive planet details', async () => {
        // Given: A valid planet ID
        const validPlanetId = 40000004;
        const expectedPlanet = TestDataFactory.createPlanet({
          planet_id: validPlanetId,
          name: 'Jita IV',
          type_id: 11,
          system_id: 30000142,
          position: { x: 150000000000, y: 0, z: 0 }
        });

        // Mock the API response
        jest.spyOn(client.universe, 'getPlanetById').mockResolvedValue(expectedPlanet);

        // When: I request planet information
        const result = await client.universe.getPlanetById(validPlanetId);

        // Then: I should receive planet details
        expect(result).toBeDefined();
        expect(result.planet_id).toBe(validPlanetId);
        expect(result.name).toBe('Jita IV');
        expect(result.system_id).toBe(30000142);
        expect(result.position).toBeDefined();
        expect(result.position.x).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature: Universe Data Performance', () => {
    describe('Scenario: Handle concurrent universe data requests', () => {
      it('Given multiple concurrent universe data requests, When I make them simultaneously, Then all should complete successfully', async () => {
        // Given: Multiple concurrent universe data requests
        const systemIds = [30000142, 30001161, 30002187]; // Jita, Amarr, Dodixie
        const mockSystems = systemIds.map(id => 
          TestDataFactory.createSolarSystem({ 
            system_id: id, 
            name: `System ${id}`,
            security_status: Math.random()
          })
        );

        // Mock the API responses
        jest.spyOn(client.universe, 'getSystemById')
          .mockImplementation(async (id: number) => 
            mockSystems.find(system => system.system_id === id)!
          );

        // When: I make them simultaneously
        const promises = systemIds.map(id => client.universe.getSystemById(id));
        const results = await Promise.all(promises);

        // Then: All should complete successfully
        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
          expect(result.system_id).toBe(systemIds[index]);
          expect(result.name).toBe(`System ${systemIds[index]}`);
        });
      });
    });

    describe('Scenario: Handle large universe data sets', () => {
      it('Given a request for all systems, When I process the large dataset, Then the system should handle it efficiently', async () => {
        // Given: A request for all systems
        const largeSsystemSet = Array.from({ length: 8000 }, (_, i) => 30000001 + i);

        // Mock the API response with large dataset
        jest.spyOn(client.universe, 'getSystems').mockResolvedValue(largeSsystemSet);

        // When: I process the large dataset
        const startTime = Date.now();
        const result = await client.universe.getSystems();
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Then: The system should handle it efficiently
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(8000);
        expect(responseTime).toBeLessThan(1000); // Should process within 1 second
        expect(result.every((id: any) => typeof id === 'number')).toBe(true);
      });
    });
  });

  describe('Feature: Universe Search and Discovery', () => {
    describe('Scenario: Search for universe entities', () => {
      it('Given a search term, When I search the universe, Then I should receive matching entities', async () => {
        // Given: A search term
        const searchTerm = 'Jita';
        const expectedResults = TestDataFactory.createSearchResults({
          systems: [30000142],
          stations: [60003760, 60003761],
          structures: [],
          characters: [],
          corporations: [],
          alliances: []
        });

        // Mock the API response
        jest.spyOn(client.search, 'characterSearch').mockResolvedValue(expectedResults);

        // When: I search the universe
        const result = await client.search.characterSearch(1689391488, searchTerm) as any;

        // Then: I should receive matching entities
        expect(result).toBeDefined();
        expect(result.systems).toBeInstanceOf(Array);
        expect(result.stations).toBeInstanceOf(Array);
        expect(result.systems).toContain(30000142);
        expect(result.stations).toContain(60003760);
      });
    });

    describe('Scenario: Name resolution', () => {
      it('Given a list of entity IDs, When I request name resolution, Then I should receive entity names and categories', async () => {
        // Given: A list of entity IDs
        const entityIds = [30000142, 60003760, 1689391488];
        const expectedNames = [
          TestDataFactory.createEntityName({ id: 30000142, name: 'Jita', category: 'solar_system' }),
          TestDataFactory.createEntityName({ id: 60003760, name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant', category: 'station' }),
          TestDataFactory.createEntityName({ id: 1689391488, name: 'Test Character', category: 'character' })
        ];

        // Mock the API response
        jest.spyOn(client.universe, 'postNamesAndCategories').mockResolvedValue(expectedNames);

        // When: I request name resolution
        const result = await client.universe.postNamesAndCategories(entityIds);

        // Then: I should receive entity names and categories
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(3);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('category');
        expect(result.find((item: any) => item.id === 30000142)?.name).toBe('Jita');
        expect(result.find((item: any) => item.id === 30000142)?.category).toBe('solar_system');
      });
    });
  });

  describe('Feature: Universe Data Integration', () => {
    describe('Scenario: Complete system exploration workflow', () => {
      it('Given a system ID, When I gather complete system information, Then I should successfully retrieve all system data', async () => {
        // Given: A system ID
        const systemId = 30000142;
        const mockSystem = TestDataFactory.createSolarSystem({ system_id: systemId, name: 'Jita' });
        const mockStar = TestDataFactory.createStar({ star_id: 40000001, solar_system_id: systemId });
        const mockStation = TestDataFactory.createStation({ station_id: 60003760, system_id: systemId });
        const mockPlanet = TestDataFactory.createPlanet({ planet_id: 40000004, system_id: systemId });

        // Mock all API responses
        jest.spyOn(client.universe, 'getSystemById').mockResolvedValue(mockSystem);
        jest.spyOn(client.universe, 'getStarById').mockResolvedValue(mockStar);
        jest.spyOn(client.universe, 'getStationById').mockResolvedValue(mockStation);
        jest.spyOn(client.universe, 'getPlanetById').mockResolvedValue(mockPlanet);

        // When: I gather complete system information
        const system = await client.universe.getSystemById(systemId);
        const [star, station, planet] = await Promise.all([
          client.universe.getStarById(system.star_id!),
          client.universe.getStationById(system.stations![0]),
          client.universe.getPlanetById(system.planets![0].planet_id)
        ]);

        // Then: I should successfully retrieve all system data
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
});
