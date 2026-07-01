import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/incursions.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN listing all active incursions, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active incursions exist in the universe', () => {
      const mockIncursions = [
        {
          type: 'Incursion',
          state: 'established' as const,
          influence: 0.65,
          has_boss: true,
          faction_id: 500019,
          constellation_id: 20000302,
          staging_solar_system_id: 30002082,
          infested_solar_systems: [30002082, 30002083, 30002084],
        },
        {
          type: 'Incursion',
          state: 'mobilizing' as const,
          influence: 0.15,
          has_boss: false,
          faction_id: 500019,
          constellation_id: 20000145,
          staging_solar_system_id: 30001012,
          infested_solar_systems: [30001012, 30001013],
        },
      ];

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockResolvedValue(mockIncursions);
    });

    when('the client requests the incursion list', async () => {
      result = await client.incursions.getIncursions();
    });

    then('the client shall return complete incursion details', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);

      const established = result[0];
      expect(established.type).toBe('Incursion');
      expect(established.state).toBe('established');
      expect(established.influence).toBe(0.65);
      expect(established.has_boss).toBe(true);
      expect(established.faction_id).toBe(500019);
      expect(established.constellation_id).toBe(20000302);
      expect(established.staging_solar_system_id).toBe(30002082);
      expect(established.infested_solar_systems).toBeInstanceOf(Array);
      expect(established.infested_solar_systems).toHaveLength(3);

      const mobilizing = result[1];
      expect(mobilizing.state).toBe('mobilizing');
      expect(mobilizing.has_boss).toBe(false);
      expect(mobilizing.influence).toBeLessThan(established.influence);
    });
  });

  test('WHILE no active incursions, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no incursions are active in the universe', () => {
      jest.spyOn(client.incursions, 'getIncursions').mockResolvedValue([]);
    });

    when('the client requests the incursion list for empty state', async () => {
      result = await client.incursions.getIncursions();
    });

    then('the client shall return an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('WHEN an incursion is withdrawing, the client shall report the withdrawing state', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an incursion in the withdrawing state', () => {
      const mockIncursions = [
        {
          type: 'Incursion',
          state: 'withdrawing' as const,
          influence: 0.0,
          has_boss: false,
          faction_id: 500019,
          constellation_id: 20000020,
          staging_solar_system_id: 30000142,
          infested_solar_systems: [30000142],
        },
      ];

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockResolvedValue(mockIncursions);
    });

    when(
      'the client requests the incursion list for withdrawing state',
      async () => {
        result = await client.incursions.getIncursions();
      },
    );

    then('the incursion shall show zero influence and no boss', () => {
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe('withdrawing');
      expect(result[0].influence).toBe(0.0);
      expect(result[0].has_boss).toBe(false);
    });
  });

  test('WHEN multiple incursions exist, the client shall return all across constellations', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('multiple incursions in different regions', () => {
      const mockIncursions = [
        {
          type: 'Incursion',
          state: 'established' as const,
          influence: 0.8,
          has_boss: true,
          faction_id: 500019,
          constellation_id: 20000302,
          staging_solar_system_id: 30002082,
          infested_solar_systems: [30002082, 30002083],
        },
        {
          type: 'Incursion',
          state: 'mobilizing' as const,
          influence: 0.3,
          has_boss: false,
          faction_id: 500019,
          constellation_id: 20000145,
          staging_solar_system_id: 30001012,
          infested_solar_systems: [30001012],
        },
        {
          type: 'Incursion',
          state: 'established' as const,
          influence: 0.55,
          has_boss: true,
          faction_id: 500019,
          constellation_id: 20000500,
          staging_solar_system_id: 30003500,
          infested_solar_systems: [30003500, 30003501, 30003502, 30003503],
        },
      ];

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockResolvedValue(mockIncursions);
    });

    when('the client requests the list of multiple incursions', async () => {
      result = await client.incursions.getIncursions();
    });

    then('each shall have unique constellation and staging system IDs', () => {
      expect(result).toHaveLength(3);

      const constellationIds = result.map((i: any) => i.constellation_id);
      const uniqueConstellations = new Set(constellationIds);
      expect(uniqueConstellations.size).toBe(3);

      const stagingIds = result.map((i: any) => i.staging_solar_system_id);
      const uniqueStaging = new Set(stagingIds);
      expect(uniqueStaging.size).toBe(3);
    });
  });

  test('IF eSI service unavailable, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is experiencing downtime', () => {
      const serviceUnavailableError = TestDataFactory.createError(503);

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockRejectedValue(serviceUnavailableError);
    });

    when('the client requests incursions during downtime', async () => {
      try {
        await client.incursions.getIncursions();
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 503 service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('IF server error during incursion retrieval, THEN the client shall return a server error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an internal server error occurs', () => {
      const serverError = TestDataFactory.createError(500);

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockRejectedValue(serverError);
    });

    when(
      'the client requests incursions and a server error happens',
      async () => {
        try {
          await client.incursions.getIncursions();
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the error shall indicate a server-side issue', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(500);
      expect((caughtError as EsiError).isServerError()).toBe(true);
    });
  });

  test('WHEN verifying incursion influence is within expected bounds, the client shall validate the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active incursions with varying influence', () => {
      const mockIncursions = [
        {
          type: 'Incursion',
          state: 'established' as const,
          influence: 0.0,
          has_boss: false,
          faction_id: 500019,
          constellation_id: 20000302,
          staging_solar_system_id: 30002082,
          infested_solar_systems: [30002082],
        },
        {
          type: 'Incursion',
          state: 'established' as const,
          influence: 1.0,
          has_boss: true,
          faction_id: 500019,
          constellation_id: 20000145,
          staging_solar_system_id: 30001012,
          infested_solar_systems: [30001012],
        },
      ];

      jest
        .spyOn(client.incursions, 'getIncursions')
        .mockResolvedValue(mockIncursions);
    });

    when('the client examines the incursion results', async () => {
      result = await client.incursions.getIncursions();
    });

    then('all influence values shall be between 0 and 1', () => {
      for (const incursion of result) {
        expect(incursion.influence).toBeGreaterThanOrEqual(0);
        expect(incursion.influence).toBeLessThanOrEqual(1);
      }
    });
  });
});
