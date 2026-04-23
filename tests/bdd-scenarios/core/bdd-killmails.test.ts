/**
 * BDD Scenarios: Killmails Management
 *
 * Comprehensive behavior-driven tests for Killmail-related APIs
 * covering character/corporation killmails, killmail details,
 * summary-to-detail workflows, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Killmails Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-killmails-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Killmails', () => {
    describe('Scenario: Retrieve recent killmails for a character', () => {
      it('Given an authenticated character, When I request their recent killmails, Then I should receive a list of killmail summaries', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedSummaries = [
          { killmail_id: 100001, killmail_hash: 'abc123def456' },
          { killmail_id: 100002, killmail_hash: 'ghi789jkl012' },
          { killmail_id: 100003, killmail_hash: 'mno345pqr678' },
        ];

        jest
          .spyOn(client.killmails, 'getCharacterRecentKillmails')
          .mockResolvedValue(expectedSummaries);

        // When: I request their recent killmails
        const result =
          await client.killmails.getCharacterRecentKillmails(characterId);

        // Then: I should receive a list of killmail summaries
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(3);
        expect(result[0]).toHaveProperty('killmail_id');
        expect(result[0]).toHaveProperty('killmail_hash');
        expect(typeof result[0].killmail_id).toBe('number');
        expect(typeof result[0].killmail_hash).toBe('string');
      });
    });

    describe('Scenario: Character with no recent killmails', () => {
      it('Given an authenticated character with no recent PvP activity, When I request their killmails, Then I should receive an empty list', async () => {
        // Given: An authenticated character with no PvP activity
        const characterId = 111111111;

        jest
          .spyOn(client.killmails, 'getCharacterRecentKillmails')
          .mockResolvedValue([]);

        // When: I request their killmails
        const result =
          await client.killmails.getCharacterRecentKillmails(characterId);

        // Then: I should receive an empty list
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Feature: Killmail Details', () => {
    describe('Scenario: Retrieve full killmail details', () => {
      it('Given a valid killmail ID and hash, When I request the killmail details, Then I should receive the complete kill report', async () => {
        // Given: A valid killmail ID and hash
        const killmailId = 100001;
        const killmailHash = 'abc123def456';
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

        // When: I request the killmail details
        const result = await client.killmails.getKillmail(
          killmailId,
          killmailHash,
        );

        // Then: I should receive the complete kill report
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

    describe('Scenario: Invalid killmail hash returns 404', () => {
      it('Given an invalid killmail hash, When I request the killmail details, Then I should receive a 404 not found error', async () => {
        // Given: An invalid killmail hash
        const killmailId = 100001;
        const invalidHash = 'invalid_hash_value';
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.killmails, 'getKillmail')
          .mockRejectedValue(notFoundError);

        // When & Then: I should receive a 404 not found error
        await expect(
          client.killmails.getKillmail(killmailId, invalidHash),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Corporation Killmails', () => {
    describe('Scenario: Retrieve recent killmails for a corporation', () => {
      it('Given an authenticated corporation member, When I request corporation killmails, Then I should receive the corporation kill feed', async () => {
        // Given: An authenticated corporation member
        const corporationId = 1344654522;
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

        // When: I request corporation killmails
        const result =
          await client.killmails.getCorporationRecentKillmails(corporationId);

        // Then: I should receive the corporation kill feed
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(5);
        result.forEach((summary: any) => {
          expect(summary).toHaveProperty('killmail_id');
          expect(summary).toHaveProperty('killmail_hash');
        });
      });
    });
  });

  describe('Feature: Killmail Workflow', () => {
    describe('Scenario: Chain summary retrieval to detail lookup', () => {
      it('Given a character with recent killmails, When I fetch summaries and then look up details for the first kill, Then I should get the full kill chain', async () => {
        // Given: A character with recent killmails
        const characterId = 1689391488;
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
        jest
          .spyOn(client.killmails, 'getKillmail')
          .mockResolvedValue(killDetail);

        // When: I fetch summaries and then look up details
        const summaryList =
          await client.killmails.getCharacterRecentKillmails(characterId);
        const firstSummary = summaryList[0];
        const detail = await client.killmails.getKillmail(
          firstSummary.killmail_id,
          firstSummary.killmail_hash,
        );

        // Then: I should get the full kill chain
        expect(summaryList.length).toBeGreaterThan(0);
        expect(detail.killmail_id).toBe(firstSummary.killmail_id);
        expect(detail.victim).toBeDefined();
        expect(detail.attackers).toBeInstanceOf(Array);
        expect(detail.attackers.length).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Analyze killmail attacker composition', () => {
      it('Given a killmail with multiple attackers, When I analyze the attackers, Then I should identify the final blow dealer and total damage', async () => {
        // Given: A killmail with multiple attackers
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

        jest
          .spyOn(client.killmails, 'getKillmail')
          .mockResolvedValue(killDetail);

        // When: I analyze the attackers
        const result = await client.killmails.getKillmail(400001, 'test_hash');
        const finalBlowAttacker = result.attackers.find(
          (a: any) => a.final_blow,
        );
        const totalDamage = result.attackers.reduce(
          (sum: number, a: any) => sum + a.damage_done,
          0,
        );

        // Then: I should identify the final blow dealer and total damage
        expect(finalBlowAttacker).toBeDefined();
        expect(finalBlowAttacker!.character_id).toBe(111111111);
        expect(totalDamage).toBe(15600);
        expect(result.attackers.length).toBe(3);
      });
    });
  });

  describe('Feature: Killmail Error Handling', () => {
    describe('Scenario: Handle unauthorized access to character killmails', () => {
      it('Given an unauthenticated request, When I request character killmails, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.killmails, 'getCharacterRecentKillmails')
          .mockRejectedValue(forbiddenError);

        // When & Then: I should receive a 403 forbidden error
        await expect(
          client.killmails.getCharacterRecentKillmails(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });
});
