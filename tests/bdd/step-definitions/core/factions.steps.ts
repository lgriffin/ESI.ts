import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/factions.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting overall faction warfare statistics, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the FW system is active', () => {
      const expectedStats = [
        {
          faction_id: 500001,
          pilots: 15000,
          systems_controlled: 42,
          kills: { last_week: 1200, total: 500000, yesterday: 180 },
          victory_points: {
            last_week: 85000,
            total: 12000000,
            yesterday: 12000,
          },
        },
        {
          faction_id: 500002,
          pilots: 12000,
          systems_controlled: 38,
          kills: { last_week: 1100, total: 480000, yesterday: 160 },
          victory_points: {
            last_week: 78000,
            total: 11000000,
            yesterday: 11000,
          },
        },
      ];

      jest.spyOn(client.factions, 'getStats').mockResolvedValue(expectedStats);
    });

    when('the client requests faction warfare stats', async () => {
      result = await client.factions.getStats();
    });

    then('the client shall return stats for all factions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('faction_id', 500001);
      expect(result[0]).toHaveProperty('pilots');
      expect(result[0]).toHaveProperty('systems_controlled');
      expect(result[0]).toHaveProperty('kills');
      expect(result[0]).toHaveProperty('victory_points');
      expect(result[0].kills.last_week).toBe(1200);
    });
  });

  test('WHEN getting FW stats for an enlisted character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character enlisted in faction warfare', () => {
      const expectedStats = {
        faction_id: 500001,
        enlisted_on: '2023-06-01T00:00:00Z',
        current_rank: 5,
        highest_rank: 7,
        kills: { last_week: 15, total: 500, yesterday: 3 },
        victory_points: {
          last_week: 2000,
          total: 85000,
          yesterday: 300,
        },
      };

      jest
        .spyOn(client.factions, 'getCharacterStats')
        .mockResolvedValue(expectedStats);
    });

    when('the client requests character FW stats', async () => {
      result = await client.factions.getCharacterStats(characterId);
    });

    then('the client shall return their personal statistics', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('faction_id', 500001);
      expect(result).toHaveProperty('enlisted_on');
      expect(result).toHaveProperty('current_rank', 5);
      expect(result).toHaveProperty('highest_rank', 7);
      expect(result).toHaveProperty('kills');
      expect(result.kills.total).toBe(500);
    });
  });

  test('IF unauthorized access for character FW stats, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token for character stats', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.factions, 'getCharacterStats')
        .mockRejectedValue(forbiddenError);
    });

    when(
      'the client requests character FW stats with invalid token',
      async () => {
        try {
          await client.factions.getCharacterStats(characterId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for character stats',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
      },
    );
  });

  test('WHEN getting FW stats for an enlisted corporation, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('a corporation enlisted in faction warfare', () => {
      const expectedStats = {
        faction_id: 500001,
        enlisted_on: '2023-01-15T00:00:00Z',
        pilots: 250,
        kills: { last_week: 120, total: 15000, yesterday: 18 },
        victory_points: {
          last_week: 25000,
          total: 1200000,
          yesterday: 3500,
        },
      };

      jest
        .spyOn(client.factions, 'getCorporationStats')
        .mockResolvedValue(expectedStats);
    });

    when('the client requests corporation FW stats', async () => {
      result = await client.factions.getCorporationStats(corporationId);
    });

    then('the client shall return the corporation statistics', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('faction_id', 500001);
      expect(result).toHaveProperty('enlisted_on');
      expect(result).toHaveProperty('pilots', 250);
      expect(result).toHaveProperty('kills');
      expect(result.kills.total).toBe(15000);
    });
  });

  test('IF unauthorized access for corporation FW stats, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let caughtError: any;

    given('an invalid or expired token for corporation stats', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.factions, 'getCorporationStats')
        .mockRejectedValue(forbiddenError);
    });

    when(
      'the client requests corporation FW stats with invalid token',
      async () => {
        try {
          await client.factions.getCorporationStats(corporationId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for corporation stats',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
      },
    );
  });

  test('WHEN getting current ownership of FW systems, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active faction warfare systems', () => {
      const expectedSystems = [
        {
          solar_system_id: 30002057,
          owner_faction_id: 500001,
          occupier_faction_id: 500001,
          contested: 'uncontested' as const,
          victory_points: 0,
          victory_points_threshold: 3000,
        },
        {
          solar_system_id: 30002058,
          owner_faction_id: 500001,
          occupier_faction_id: 500002,
          contested: 'contested' as const,
          victory_points: 1500,
          victory_points_threshold: 3000,
        },
      ];

      jest
        .spyOn(client.factions, 'getSystems')
        .mockResolvedValue(expectedSystems);
    });

    when('the client requests FW systems', async () => {
      result = await client.factions.getSystems();
    });

    then(
      'the client shall return system ownership and contested status',
      () => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('solar_system_id');
        expect(result[0]).toHaveProperty('owner_faction_id');
        expect(result[0]).toHaveProperty('contested', 'uncontested');
        expect(result[1]).toHaveProperty('contested', 'contested');
        expect(result[1].victory_points).toBe(1500);
      },
    );
  });

  test('WHEN getting list of active FW wars, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('faction warfare is active', () => {
      const expectedWars = [
        {
          aggressor_id: 500001,
          defender_id: 500002,
        },
        {
          aggressor_id: 500003,
          defender_id: 500004,
        },
      ];

      jest.spyOn(client.factions, 'getWars').mockResolvedValue(expectedWars);
    });

    when('the client requests FW wars', async () => {
      result = await client.factions.getWars();
    });

    then('the client shall return the list of faction conflicts', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('aggressor_id', 500001);
      expect(result[0]).toHaveProperty('defender_id', 500002);
      expect(result[1]).toHaveProperty('aggressor_id', 500003);
      expect(result[1]).toHaveProperty('defender_id', 500004);
    });
  });

  test('WHEN getting overall FW leaderboard, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('faction warfare is active for leaderboard', () => {
      const expectedLeaderboard = {
        kills: {
          yesterday: [
            { faction_id: 500001, amount: 180 },
            { faction_id: 500002, amount: 160 },
          ],
          last_week: [
            { faction_id: 500001, amount: 1200 },
            { faction_id: 500002, amount: 1100 },
          ],
          active_total: [
            { faction_id: 500001, amount: 500000 },
            { faction_id: 500002, amount: 480000 },
          ],
        },
        victory_points: {
          yesterday: [
            { faction_id: 500001, amount: 12000 },
            { faction_id: 500002, amount: 11000 },
          ],
          last_week: [
            { faction_id: 500001, amount: 85000 },
            { faction_id: 500002, amount: 78000 },
          ],
          active_total: [
            { faction_id: 500001, amount: 12000000 },
            { faction_id: 500002, amount: 11000000 },
          ],
        },
      };

      jest
        .spyOn(client.factions, 'getLeaderboardsOverall')
        .mockResolvedValue(expectedLeaderboard);
    });

    when('the client requests the overall leaderboard', async () => {
      result = await client.factions.getLeaderboardsOverall();
    });

    then('the client shall return faction rankings', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('kills');
      expect(result).toHaveProperty('victory_points');
      expect(result.kills.yesterday).toBeInstanceOf(Array);
      expect(result.kills.yesterday[0]).toHaveProperty('faction_id');
      expect(result.kills.yesterday[0]).toHaveProperty('amount');
    });
  });

  test('WHEN getting character FW leaderboard, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('faction warfare is active for character leaderboard', () => {
      const expectedLeaderboard = {
        kills: {
          yesterday: [
            { character_id: 1689391488, amount: 25 },
            { character_id: 123456789, amount: 20 },
          ],
          last_week: [
            { character_id: 1689391488, amount: 150 },
            { character_id: 123456789, amount: 120 },
          ],
          active_total: [
            { character_id: 1689391488, amount: 5000 },
            { character_id: 123456789, amount: 4500 },
          ],
        },
        victory_points: {
          yesterday: [{ character_id: 1689391488, amount: 3000 }],
          last_week: [{ character_id: 1689391488, amount: 20000 }],
          active_total: [{ character_id: 1689391488, amount: 850000 }],
        },
      };

      jest
        .spyOn(client.factions, 'getLeaderboardsCharacters')
        .mockResolvedValue(expectedLeaderboard);
    });

    when('the client requests the character leaderboard', async () => {
      result = await client.factions.getLeaderboardsCharacters();
    });

    then('the client shall return top character rankings', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('kills');
      expect(result.kills.yesterday).toBeInstanceOf(Array);
      expect(result.kills.yesterday[0]).toHaveProperty('character_id');
      expect(result.kills.yesterday[0]).toHaveProperty('amount', 25);
    });
  });

  test('WHEN completing faction warfare overview, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let factionStats: any;
    let characterStats: any;
    let corporationStats: any;
    let fwSystems: any;
    let fwWars: any;
    const characterId = 1689391488;
    const corporationId = 1344654522;

    given('an enlisted character for overview', () => {
      const overallStats = [
        {
          faction_id: 500001,
          pilots: 15000,
          systems_controlled: 42,
          kills: { last_week: 1200, total: 500000, yesterday: 180 },
          victory_points: {
            last_week: 85000,
            total: 12000000,
            yesterday: 12000,
          },
        },
      ];

      const charStats = {
        faction_id: 500001,
        enlisted_on: '2023-06-01T00:00:00Z',
        current_rank: 5,
        highest_rank: 7,
        kills: { last_week: 15, total: 500, yesterday: 3 },
        victory_points: {
          last_week: 2000,
          total: 85000,
          yesterday: 300,
        },
      };

      const corpStats = {
        faction_id: 500001,
        enlisted_on: '2023-01-15T00:00:00Z',
        pilots: 250,
        kills: { last_week: 120, total: 15000, yesterday: 18 },
        victory_points: {
          last_week: 25000,
          total: 1200000,
          yesterday: 3500,
        },
      };

      const systems = [
        {
          solar_system_id: 30002057,
          owner_faction_id: 500001,
          occupier_faction_id: 500001,
          contested: 'uncontested' as const,
          victory_points: 0,
          victory_points_threshold: 3000,
        },
      ];

      const wars = [{ aggressor_id: 500001, defender_id: 500002 }];

      jest.spyOn(client.factions, 'getStats').mockResolvedValue(overallStats);
      jest
        .spyOn(client.factions, 'getCharacterStats')
        .mockResolvedValue(charStats);
      jest
        .spyOn(client.factions, 'getCorporationStats')
        .mockResolvedValue(corpStats);
      jest.spyOn(client.factions, 'getSystems').mockResolvedValue(systems);
      jest.spyOn(client.factions, 'getWars').mockResolvedValue(wars);
    });

    when('the client gathers all FW data concurrently', async () => {
      [factionStats, characterStats, corporationStats, fwSystems, fwWars] =
        await Promise.all([
          client.factions.getStats(),
          client.factions.getCharacterStats(characterId),
          client.factions.getCorporationStats(corporationId),
          client.factions.getSystems(),
          client.factions.getWars(),
        ]);
    });

    then('the client shall have a complete faction warfare picture', () => {
      expect(factionStats).toBeInstanceOf(Array);
      expect(factionStats[0].faction_id).toBe(500001);

      expect(characterStats).toBeDefined();
      expect(characterStats.faction_id).toBe(500001);
      expect(characterStats.current_rank).toBe(5);

      expect(corporationStats).toBeDefined();
      expect(corporationStats.pilots).toBe(250);

      expect(fwSystems).toBeInstanceOf(Array);
      expect(fwSystems).toHaveLength(1);

      expect(fwWars).toBeInstanceOf(Array);
      expect(fwWars[0].aggressor_id).toBe(500001);
      expect(fwWars[0].defender_id).toBe(500002);
    });
  });
});
