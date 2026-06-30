import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/pi.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  test('List all colonies for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const expectedColonies = [
      {
        planet_id: 40000001,
        planet_type: 'temperate',
        solar_system_id: 30000142,
        num_pins: 8,
        last_update: '2024-03-15T10:00:00Z',
        owner_id: characterId,
        upgrade_level: 5,
      },
      {
        planet_id: 40000002,
        planet_type: 'barren',
        solar_system_id: 30000142,
        num_pins: 6,
        last_update: '2024-03-14T08:00:00Z',
        owner_id: characterId,
        upgrade_level: 4,
      },
    ];

    given('a valid character ID for PI', () => {
      jest
        .spyOn(client.pi, 'getColonies')
        .mockResolvedValue(expectedColonies as any);
    });

    when('I request planetary colonies', async () => {
      result = await client.pi.getColonies(characterId);
    });

    then('I should receive a list of colonies', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].planet_id).toBe(40000001);
      expect(result[0].planet_type).toBe('temperate');
      expect(result[1].upgrade_level).toBe(4);
    });
  });

  test('Character with no colonies', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;

    given('a character with no PI colonies', () => {
      jest.spyOn(client.pi, 'getColonies').mockResolvedValue([]);
    });

    when('I request colonies', async () => {
      result = await client.pi.getColonies(characterId);
    });

    then('I should receive an empty colony array', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  test('Get detailed layout for a colony', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const planetId = 40000001;
    const expectedLayout = {
      pins: [
        {
          pin_id: 1001,
          type_id: 2254,
          latitude: 0.5,
          longitude: 1.2,
          schematic_id: 130,
        },
        {
          pin_id: 1002,
          type_id: 2256,
          latitude: 0.6,
          longitude: 1.3,
          schematic_id: 0,
        },
      ],
      links: [{ source_pin_id: 1001, destination_pin_id: 1002, link_level: 0 }],
      routes: [
        {
          route_id: 5001,
          source_pin_id: 1001,
          destination_pin_id: 1002,
          content_type_id: 2389,
          quantity: 100,
        },
      ],
    };

    given('a character ID and planet ID', () => {
      jest
        .spyOn(client.pi, 'getColonyLayout')
        .mockResolvedValue(expectedLayout as any);
    });

    when('I request the colony layout', async () => {
      result = await client.pi.getColonyLayout(characterId, planetId);
    });

    then('I should receive pins, links, and routes', () => {
      expect(result).toBeDefined();
      expect(result.pins).toHaveLength(2);
      expect(result.links).toHaveLength(1);
      expect(result.routes).toHaveLength(1);
      expect(result.links[0].source_pin_id).toBe(1001);
      expect(result.links[0].destination_pin_id).toBe(1002);
    });
  });

  test('Get layout for an empty colony', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const planetId = 40000003;
    const emptyLayout = { pins: [], links: [], routes: [] };

    given('a colony with no structures', () => {
      jest
        .spyOn(client.pi, 'getColonyLayout')
        .mockResolvedValue(emptyLayout as any);
    });

    when('I request the layout', async () => {
      result = await client.pi.getColonyLayout(characterId, planetId);
    });

    then('I should receive empty arrays', () => {
      expect(result.pins).toHaveLength(0);
      expect(result.links).toHaveLength(0);
      expect(result.routes).toHaveLength(0);
    });
  });

  test('Get a PI schematic by ID', ({ given, when, then }) => {
    let result: any;
    const schematicId = 130;
    const expectedSchematic = {
      schematic_id: 130,
      schematic_name: 'Bacteria',
      cycle_time: 1800,
    };

    given('a valid schematic ID', () => {
      jest
        .spyOn(client.pi, 'getSchematicInformation')
        .mockResolvedValue(expectedSchematic as any);
    });

    when('I request the schematic', async () => {
      result = await client.pi.getSchematicInformation(schematicId);
    });

    then('I should receive schematic details', () => {
      expect(result).toBeDefined();
      expect(result.schematic_name).toBe('Bacteria');
      expect(result.cycle_time).toBe(1800);
    });
  });

  test('Schematic not found', ({ given, when, then }) => {
    let caughtError: any;
    const schematicId = 999999;

    given('an invalid schematic ID', () => {
      const error = TestDataFactory.createError(404);
      jest.spyOn(client.pi, 'getSchematicInformation').mockRejectedValue(error);
    });

    when('I request the invalid schematic', async () => {
      try {
        await client.pi.getSchematicInformation(schematicId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('List customs offices for a corporation', ({ given, when, then }) => {
    let result: any;
    const corporationId = 1344654522;
    const expectedOffices = [
      {
        office_id: 7001,
        system_id: 30000142,
        planet_id: 40000001,
        reinforce_exit_start: 18,
        reinforce_exit_end: 21,
        alliance_tax_rate: 0.1,
        corporation_tax_rate: 0.05,
        standing_level: 'terrible',
        terrible_standing_tax_rate: 0.5,
      },
      {
        office_id: 7002,
        system_id: 30000143,
        planet_id: 40000010,
        reinforce_exit_start: 0,
        reinforce_exit_end: 3,
        alliance_tax_rate: 0.1,
        corporation_tax_rate: 0.05,
        standing_level: 'neutral',
        terrible_standing_tax_rate: 0.5,
      },
    ];

    given('a valid corporation ID for customs offices', () => {
      jest
        .spyOn(client.pi, 'getCorporationCustomsOffices')
        .mockResolvedValue(expectedOffices as any);
    });

    when('I request customs offices', async () => {
      result = await client.pi.getCorporationCustomsOffices(corporationId);
    });

    then('I should receive a list of customs offices', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].office_id).toBe(7001);
      expect(result[1].system_id).toBe(30000143);
    });
  });

  test('Unauthorized access to customs offices', ({ given, when, then }) => {
    let caughtError: any;
    const corporationId = 1344654522;

    given('insufficient permissions for customs offices', () => {
      const error = TestDataFactory.createError(403);
      jest
        .spyOn(client.pi, 'getCorporationCustomsOffices')
        .mockRejectedValue(error);
    });

    when('I request customs offices without permissions', async () => {
      try {
        await client.pi.getCorporationCustomsOffices(corporationId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Retrieve colonies and inspect their layouts', ({
    given,
    when,
    then,
  }) => {
    let allColonies: any;
    let colonyLayout: any;
    const characterId = 90000001;
    const colonies = [
      {
        planet_id: 40000001,
        planet_type: 'temperate',
        solar_system_id: 30000142,
        num_pins: 5,
        last_update: '2024-03-15T10:00:00Z',
        owner_id: characterId,
        upgrade_level: 5,
      },
    ];
    const layout = {
      pins: [{ pin_id: 1001, type_id: 2254, latitude: 0.5, longitude: 1.2 }],
      links: [],
      routes: [],
    };

    given('a character with colonies for workflow', () => {
      jest.spyOn(client.pi, 'getColonies').mockResolvedValue(colonies as any);
      jest.spyOn(client.pi, 'getColonyLayout').mockResolvedValue(layout as any);
    });

    when('I retrieve colonies and then their layouts', async () => {
      allColonies = await client.pi.getColonies(characterId);
      colonyLayout = await client.pi.getColonyLayout(
        characterId,
        allColonies[0].planet_id,
      );
    });

    then('I should have complete PI data', () => {
      expect(allColonies).toHaveLength(1);
      expect(colonyLayout.pins).toHaveLength(1);
      expect(client.pi.getColonyLayout).toHaveBeenCalledWith(
        characterId,
        40000001,
      );
    });
  });
});
