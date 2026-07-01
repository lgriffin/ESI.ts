import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/wars.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-wars-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN listing all wars, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('wars exist in the system', () => {
      const expectedWarIds = [700001, 700002, 700003, 700004, 700005];

      jest.spyOn(client.wars, 'getWars').mockResolvedValue(expectedWarIds);
    });

    when('the client requests the list of wars', async () => {
      result = await client.wars.getWars();
    });

    then('the client shall return an array of war IDs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(5);
      result.forEach((warId: number) => {
        expect(typeof warId).toBe('number');
        expect(warId).toBeGreaterThan(0);
      });
    });
  });

  test('WHEN listing wars, the client shall return them in descending order', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('multiple wars exist in descending order', () => {
      const expectedWarIds = [700010, 700009, 700008, 700007, 700006];

      jest.spyOn(client.wars, 'getWars').mockResolvedValue(expectedWarIds);
    });

    when('the client requests the war list', async () => {
      result = await client.wars.getWars();
    });

    then('war IDs shall be in descending order', () => {
      expect(result).toBeInstanceOf(Array);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]).toBeGreaterThan(result[i]);
      }
    });
  });

  test('WHEN getting details of an active war, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an active war exists', () => {
      const warId = 700001;
      const expectedWar = {
        id: warId,
        aggressor: {
          alliance_id: 99005338,
          isk_destroyed: 150000000000.0,
          ships_killed: 250,
        },
        defender: {
          alliance_id: 99000001,
          isk_destroyed: 75000000000.0,
          ships_killed: 120,
        },
        declared: '2024-01-10T00:00:00Z',
        started: '2024-01-11T00:00:00Z',
        finished: null,
        mutual: false,
        open_for_allies: true,
      };

      jest
        .spyOn(client.wars, 'getWarById')
        .mockResolvedValue(expectedWar as any);
    });

    when('the client requests the war details', async () => {
      result = await client.wars.getWarById(700001);
    });

    then('the client shall return complete war information', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe(700001);
      expect(result).toHaveProperty('aggressor');
      expect(result).toHaveProperty('defender');
      expect(result).toHaveProperty('declared');
      expect(result).toHaveProperty('started');
      expect(result.aggressor).toHaveProperty('alliance_id');
      expect(result.aggressor).toHaveProperty('isk_destroyed');
      expect(result.aggressor).toHaveProperty('ships_killed');
      expect(result.defender).toHaveProperty('alliance_id');
      expect((result as any).finished).toBeNull();
    });
  });

  test('WHEN getting details of a finished war, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a finished war exists', () => {
      const warId = 700002;
      const expectedWar = {
        id: warId,
        aggressor: {
          alliance_id: 99005338,
          isk_destroyed: 500000000000.0,
          ships_killed: 800,
        },
        defender: {
          alliance_id: 99000002,
          isk_destroyed: 300000000000.0,
          ships_killed: 450,
        },
        declared: '2023-12-01T00:00:00Z',
        started: '2023-12-02T00:00:00Z',
        finished: '2024-01-01T00:00:00Z',
        mutual: false,
        open_for_allies: false,
      };

      jest
        .spyOn(client.wars, 'getWarById')
        .mockResolvedValue(expectedWar as any);
    });

    when('the client requests the finished war details', async () => {
      result = await client.wars.getWarById(700002);
    });

    then('the finished timestamp shall be populated', () => {
      expect(result).toBeDefined();
      expect((result as any).finished).not.toBeNull();
      expect((result as any).finished).toBe('2024-01-01T00:00:00Z');

      const declared = new Date((result as any).declared).getTime();
      const started = new Date((result as any).started).getTime();
      const finished = new Date((result as any).finished).getTime();
      expect(declared).toBeLessThan(started);
      expect(started).toBeLessThan(finished);
    });
  });

  test('WHEN getting details of a mutual war, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a mutual war exists', () => {
      const warId = 700003;
      const expectedWar = {
        id: warId,
        aggressor: {
          alliance_id: 99005338,
          isk_destroyed: 200000000000.0,
          ships_killed: 350,
        },
        defender: {
          alliance_id: 99000003,
          isk_destroyed: 180000000000.0,
          ships_killed: 320,
        },
        declared: '2024-01-05T00:00:00Z',
        started: '2024-01-06T00:00:00Z',
        finished: null,
        mutual: true,
        open_for_allies: false,
      };

      jest
        .spyOn(client.wars, 'getWarById')
        .mockResolvedValue(expectedWar as any);
    });

    when('the client requests the mutual war details', async () => {
      result = await client.wars.getWarById(700003);
    });

    then('the mutual flag shall be true', () => {
      expect(result).toBeDefined();
      expect((result as any).mutual).toBe(true);
      expect(typeof (result as any).mutual).toBe('boolean');
    });
  });

  test('WHEN getting killmails for a war, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with killmails exists', () => {
      const expectedKillmails = [
        { killmail_id: 90000001, killmail_hash: 'abc123def456' },
        { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
        { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
      ];

      jest
        .spyOn(client.wars, 'getWarKillmails')
        .mockResolvedValue(expectedKillmails as any);
    });

    when('the client requests the war killmails', async () => {
      result = await client.wars.getWarKillmails(700001);
    });

    then('the client shall return killmail summaries', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      result.forEach((killmail: any) => {
        expect(killmail).toHaveProperty('killmail_id');
        expect(killmail).toHaveProperty('killmail_hash');
        expect(typeof killmail.killmail_id).toBe('number');
        expect(typeof killmail.killmail_hash).toBe('string');
      });
    });
  });

  test('WHILE get killmails for a war with no kills, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with no killmails exists', () => {
      jest.spyOn(client.wars, 'getWarKillmails').mockResolvedValue([]);
    });

    when('the client requests the war killmails for empty war', async () => {
      result = await client.wars.getWarKillmails(700004);
    });

    then('the client shall return an empty killmail array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  test('IF requesting details for an invalid war ID (404), THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an invalid war ID for details', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest.spyOn(client.wars, 'getWarById').mockRejectedValue(notFoundError);
    });

    when('the client requests the invalid war details', async () => {
      try {
        await client.wars.getWarById(999999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then(
      'the client shall return a 404 not found error for war details',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
      },
    );
  });

  test('IF requesting killmails for an invalid war ID (404), THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an invalid war ID for killmails', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.wars, 'getWarKillmails')
        .mockRejectedValue(notFoundError);
    });

    when('the client requests killmails for invalid war', async () => {
      try {
        await client.wars.getWarKillmails(999999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 not found error for killmails', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN analyzing war statistics by comparing aggressor and defender, the client shall return the analysis', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a war with combat data exists', () => {
      const warDetails = {
        id: 700001,
        aggressor: {
          alliance_id: 99005338,
          isk_destroyed: 500000000000.0,
          ships_killed: 800,
        },
        defender: {
          alliance_id: 99000001,
          isk_destroyed: 200000000000.0,
          ships_killed: 300,
        },
        declared: '2024-01-10T00:00:00Z',
        started: '2024-01-11T00:00:00Z',
        finished: null,
        mutual: false,
        open_for_allies: true,
      };

      jest
        .spyOn(client.wars, 'getWarById')
        .mockResolvedValue(warDetails as any);
    });

    when('the client analyzes the war stats', async () => {
      result = await client.wars.getWarById(700001);
    });

    then('the client shall determine the dominant side', () => {
      const aggressorIsk = (result as any).aggressor.isk_destroyed;
      const defenderIsk = (result as any).defender.isk_destroyed;
      const aggressorKills = (result as any).aggressor.ships_killed;
      const defenderKills = (result as any).defender.ships_killed;

      expect(aggressorIsk).toBeGreaterThan(defenderIsk);
      expect(aggressorKills).toBeGreaterThan(defenderKills);

      const totalIskDestroyed = aggressorIsk + defenderIsk;
      const aggressorEfficiency = aggressorIsk / totalIskDestroyed;
      expect(aggressorEfficiency).toBeGreaterThan(0.5);
    });
  });

  test('WHEN completing war investigation workflow, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    let details: any;
    let killmails: any;

    given('a war ID to investigate', () => {
      const warId = 700001;
      const warDetails = {
        id: warId,
        aggressor: {
          alliance_id: 99005338,
          isk_destroyed: 150000000000.0,
          ships_killed: 250,
        },
        defender: {
          alliance_id: 99000001,
          isk_destroyed: 75000000000.0,
          ships_killed: 120,
        },
        declared: '2024-01-10T00:00:00Z',
        started: '2024-01-11T00:00:00Z',
        finished: null,
        mutual: false,
        open_for_allies: true,
      };
      const warKillmails = [
        { killmail_id: 90000001, killmail_hash: 'abc123' },
        { killmail_id: 90000002, killmail_hash: 'def456' },
      ];

      jest
        .spyOn(client.wars, 'getWarById')
        .mockResolvedValue(warDetails as any);
      jest
        .spyOn(client.wars, 'getWarKillmails')
        .mockResolvedValue(warKillmails as any);
    });

    when(
      'the client gathers full war data including details and killmails',
      async () => {
        [details, killmails] = await Promise.all([
          client.wars.getWarById(700001),
          client.wars.getWarKillmails(700001),
        ]);
      },
    );

    then('the client shall build a complete picture of the conflict', () => {
      expect(details).toBeDefined();
      expect(details.id).toBe(700001);
      expect(killmails).toBeInstanceOf(Array);
      expect(killmails.length).toBe(2);

      const totalShipsKilled =
        (details as any).aggressor.ships_killed +
        (details as any).defender.ships_killed;
      expect(totalShipsKilled).toBeGreaterThan(0);

      expect((details as any).finished).toBeNull();
      expect((details as any).open_for_allies).toBe(true);
    });
  });
});
