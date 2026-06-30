import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/killmails.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-killmails-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Retrieve recent killmails for a character', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with killmails', () => {
      const expectedSummaries = [
        { killmail_id: 100001, killmail_hash: 'abc123def456' },
        { killmail_id: 100002, killmail_hash: 'ghi789jkl012' },
        { killmail_id: 100003, killmail_hash: 'mno345pqr678' },
      ];

      jest
        .spyOn(client.killmails, 'getCharacterRecentKillmails')
        .mockResolvedValue(expectedSummaries);
    });

    when('I request their recent killmails', async () => {
      result = await client.killmails.getCharacterRecentKillmails(characterId);
    });

    then('I should receive a list of killmail summaries', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('killmail_id');
      expect(result[0]).toHaveProperty('killmail_hash');
      expect(typeof result[0].killmail_id).toBe('number');
      expect(typeof result[0].killmail_hash).toBe('string');
    });
  });

  test('Character with no recent killmails', ({ given, when, then }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character with no recent PvP activity', () => {
      jest
        .spyOn(client.killmails, 'getCharacterRecentKillmails')
        .mockResolvedValue([]);
    });

    when('I request their killmails', async () => {
      result = await client.killmails.getCharacterRecentKillmails(characterId);
    });

    then('I should receive an empty killmail list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  test('Retrieve full killmail details', ({ given, when, then }) => {
    const killmailId = 100001;
    const killmailHash = 'abc123def456';
    let result: any;

    given('a valid killmail ID and hash', () => {
      const expectedDetail = {
        killmail_id: killmailId,
        killmail_time: '2024-01-15T12:30:00Z',
        solar_system_id: 30000142,
        victim: {
          ship_type_id: 587,
          character_id: 987654321,
          corporation_id: 1344654522,
          damage_taken: 8200,
          items: [
            {
              item_type_id: 3170,
              quantity_destroyed: 1,
              flag: 11,
              singleton: 0,
            },
          ],
        },
        attackers: [
          {
            character_id: 1689391488,
            ship_type_id: 24690,
            damage_done: 5000,
            final_blow: true,
            security_status: 5.0,
          },
          {
            character_id: 123456789,
            ship_type_id: 17918,
            damage_done: 3200,
            final_blow: false,
            security_status: 3.2,
          },
        ],
      };

      jest
        .spyOn(client.killmails, 'getKillmail')
        .mockResolvedValue(expectedDetail);
    });

    when('I request the killmail details', async () => {
      result = await client.killmails.getKillmail(killmailId, killmailHash);
    });

    then('I should receive the complete kill report', () => {
      expect(result).toBeDefined();
      expect(result.killmail_id).toBe(killmailId);
      expect(result.killmail_time).toBeDefined();
      expect(result.solar_system_id).toBe(30000142);
      expect(result.victim).toHaveProperty('ship_type_id');
      expect(result.victim).toHaveProperty('character_id');
      expect(result.victim).toHaveProperty('items');
      expect(result.attackers).toBeInstanceOf(Array);
      expect(result.attackers.length).toBeGreaterThan(0);
      expect(result.attackers.some((a: any) => a.final_blow === true)).toBe(
        true,
      );
    });
  });

  test('Invalid killmail hash returns 404', ({ given, when, then }) => {
    const killmailId = 100001;
    const invalidHash = 'invalid_hash_value';
    let caughtError: any;

    given('an invalid killmail hash', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.killmails, 'getKillmail')
        .mockRejectedValue(notFoundError);
    });

    when('I request the killmail details with invalid hash', async () => {
      try {
        await client.killmails.getKillmail(killmailId, invalidHash);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 404 not found error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Retrieve recent killmails for a corporation', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('an authenticated corporation member', () => {
      const expectedSummaries = [
        { killmail_id: 200001, killmail_hash: 'corp_hash_aaa' },
        { killmail_id: 200002, killmail_hash: 'corp_hash_bbb' },
        { killmail_id: 200003, killmail_hash: 'corp_hash_ccc' },
        { killmail_id: 200004, killmail_hash: 'corp_hash_ddd' },
        { killmail_id: 200005, killmail_hash: 'corp_hash_eee' },
      ];

      jest
        .spyOn(client.killmails, 'getCorporationRecentKillmails')
        .mockResolvedValue(expectedSummaries);
    });

    when('I request corporation killmails', async () => {
      result =
        await client.killmails.getCorporationRecentKillmails(corporationId);
    });

    then('I should receive the corporation kill feed', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(5);
      result.forEach((summary: any) => {
        expect(summary).toHaveProperty('killmail_id');
        expect(summary).toHaveProperty('killmail_hash');
      });
    });
  });

  test('Chain summary retrieval to detail lookup', ({ given, when, then }) => {
    const characterId = 1689391488;
    let summaryList: any;
    let detail: any;

    given('a character with recent killmails for chaining', () => {
      const summaries = [
        { killmail_id: 300001, killmail_hash: 'chain_hash_001' },
        { killmail_id: 300002, killmail_hash: 'chain_hash_002' },
      ];

      const killDetail = {
        killmail_id: 300001,
        killmail_time: '2024-01-15T14:00:00Z',
        solar_system_id: 30002187,
        victim: {
          ship_type_id: 11393,
          character_id: 555555555,
          corporation_id: 666666666,
          damage_taken: 12500,
          items: [],
        },
        attackers: [
          {
            character_id: 1689391488,
            ship_type_id: 17918,
            damage_done: 12500,
            final_blow: true,
            security_status: 5.0,
          },
        ],
      };

      jest
        .spyOn(client.killmails, 'getCharacterRecentKillmails')
        .mockResolvedValue(summaries);
      jest.spyOn(client.killmails, 'getKillmail').mockResolvedValue(killDetail);
    });

    when(
      'I fetch summaries and then look up details for the first kill',
      async () => {
        summaryList =
          await client.killmails.getCharacterRecentKillmails(characterId);
        const firstSummary = summaryList[0];
        detail = await client.killmails.getKillmail(
          firstSummary.killmail_id,
          firstSummary.killmail_hash,
        );
      },
    );

    then('I should get the full kill chain', () => {
      expect(summaryList.length).toBeGreaterThan(0);
      expect(detail.killmail_id).toBe(summaryList[0].killmail_id);
      expect(detail.victim).toBeDefined();
      expect(detail.attackers).toBeInstanceOf(Array);
      expect(detail.attackers.length).toBeGreaterThan(0);
    });
  });

  test('Analyze killmail attacker composition', ({ given, when, then }) => {
    let result: any;
    let finalBlowAttacker: any;
    let totalDamage: number;

    given('a killmail with multiple attackers', () => {
      const killDetail = {
        killmail_id: 400001,
        killmail_time: '2024-02-01T08:00:00Z',
        solar_system_id: 30000142,
        victim: {
          ship_type_id: 645,
          character_id: 333333333,
          corporation_id: 444444444,
          damage_taken: 15600,
          items: [],
        },
        attackers: [
          {
            character_id: 1689391488,
            ship_type_id: 24690,
            damage_done: 8000,
            final_blow: false,
            security_status: 5.0,
          },
          {
            character_id: 123456789,
            ship_type_id: 17918,
            damage_done: 5500,
            final_blow: false,
            security_status: 3.2,
          },
          {
            character_id: 111111111,
            ship_type_id: 587,
            damage_done: 2100,
            final_blow: true,
            security_status: 1.5,
          },
        ],
      };

      jest.spyOn(client.killmails, 'getKillmail').mockResolvedValue(killDetail);
    });

    when('I analyze the attackers', async () => {
      result = await client.killmails.getKillmail(400001, 'test_hash');
      finalBlowAttacker = result.attackers.find((a: any) => a.final_blow);
      totalDamage = result.attackers.reduce(
        (sum: number, a: any) => sum + a.damage_done,
        0,
      );
    });

    then('I should identify the final blow dealer and total damage', () => {
      expect(finalBlowAttacker).toBeDefined();
      expect(finalBlowAttacker!.character_id).toBe(111111111);
      expect(totalDamage).toBe(15600);
      expect(result.attackers.length).toBe(3);
    });
  });

  test('Handle unauthorized access to character killmails', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated killmail request', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.killmails, 'getCharacterRecentKillmails')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character killmails without auth', async () => {
      try {
        await client.killmails.getCharacterRecentKillmails(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for killmails', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
