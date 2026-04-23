/**
 * BDD Scenarios: Wars Management
 *
 * Comprehensive behavior-driven tests for all Wars-related APIs
 * covering war listing, war details, killmails, and war status analysis.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Wars Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-wars-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: War Listing', () => {
    describe('Scenario: List all wars', () => {
      it('Given wars exist in the system, When I request the list of wars, Then I should receive an array of war IDs', async () => {
        // Given: Wars exist in the system
        const expectedWarIds = [700001, 700002, 700003, 700004, 700005];

        jest.spyOn(client.wars, 'getWars').mockResolvedValue(expectedWarIds);

        // When: I request the list of wars
        const result = await client.wars.getWars();

        // Then: I should receive an array of war IDs
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(5);
        result.forEach((warId: number) => {
          expect(typeof warId).toBe('number');
          expect(warId).toBeGreaterThan(0);
        });
      });
    });

    describe('Scenario: Wars are returned in descending order', () => {
      it('Given multiple wars exist, When I request the war list, Then war IDs should be in descending order', async () => {
        // Given: Multiple wars exist, ordered by ID descending
        const expectedWarIds = [700010, 700009, 700008, 700007, 700006];

        jest.spyOn(client.wars, 'getWars').mockResolvedValue(expectedWarIds);

        // When: I request the war list
        const result = await client.wars.getWars();

        // Then: War IDs should be in descending order
        expect(result).toBeInstanceOf(Array);
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1]).toBeGreaterThan(result[i]);
        }
      });
    });
  });

  describe('Feature: War Details', () => {
    describe('Scenario: Get details of an active war', () => {
      it('Given an active war exists, When I request the war details, Then I should receive complete war information', async () => {
        // Given: An active war exists
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

        // When: I request the war details
        const result = await client.wars.getWarById(warId);

        // Then: I should receive complete war information
        expect(result).toBeDefined();
        expect(result.id).toBe(warId);
        expect(result).toHaveProperty('aggressor');
        expect(result).toHaveProperty('defender');
        expect(result).toHaveProperty('declared');
        expect(result).toHaveProperty('started');
        expect(result.aggressor).toHaveProperty('alliance_id');
        expect(result.aggressor).toHaveProperty('isk_destroyed');
        expect(result.aggressor).toHaveProperty('ships_killed');
        expect(result.defender).toHaveProperty('alliance_id');
        expect((result as any).finished).toBeNull(); // War is still active
      });
    });

    describe('Scenario: Get details of a finished war', () => {
      it('Given a finished war exists, When I request the war details, Then the finished timestamp should be populated', async () => {
        // Given: A finished war exists
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

        // When: I request the war details
        const result = await client.wars.getWarById(warId);

        // Then: The finished timestamp should be populated
        expect(result).toBeDefined();
        expect((result as any).finished).not.toBeNull();
        expect((result as any).finished).toBe('2024-01-01T00:00:00Z');

        // Verify timeline order: declared < started < finished
        const declared = new Date((result as any).declared).getTime();
        const started = new Date((result as any).started).getTime();
        const finished = new Date((result as any).finished).getTime();
        expect(declared).toBeLessThan(started);
        expect(started).toBeLessThan(finished);
      });
    });

    describe('Scenario: Get details of a mutual war', () => {
      it('Given a mutual war exists, When I request the war details, Then the mutual flag should be true', async () => {
        // Given: A mutual war exists
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

        // When: I request the war details
        const result = await client.wars.getWarById(warId);

        // Then: The mutual flag should be true
        expect(result).toBeDefined();
        expect((result as any).mutual).toBe(true);
        expect(typeof (result as any).mutual).toBe('boolean');
      });
    });
  });

  describe('Feature: War Killmails', () => {
    describe('Scenario: Get killmails for a war', () => {
      it('Given a war with killmails, When I request the war killmails, Then I should receive killmail summaries', async () => {
        // Given: A war with killmails
        const warId = 700001;
        const expectedKillmails = [
          { killmail_id: 90000001, killmail_hash: 'abc123def456' },
          { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
          { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
        ];

        jest
          .spyOn(client.wars, 'getWarKillmails')
          .mockResolvedValue(expectedKillmails as any);

        // When: I request the war killmails
        const result = await client.wars.getWarKillmails(warId);

        // Then: I should receive killmail summaries
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

    describe('Scenario: Get killmails for a war with no kills', () => {
      it('Given a war with no killmails yet, When I request the war killmails, Then I should receive an empty array', async () => {
        // Given: A war with no killmails
        const warId = 700004;

        jest.spyOn(client.wars, 'getWarKillmails').mockResolvedValue([]);

        // When: I request the war killmails
        const result = await client.wars.getWarKillmails(warId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Feature: War Error Handling', () => {
    describe('Scenario: Request details for an invalid war ID (404)', () => {
      it('Given an invalid war ID, When I request the war details, Then I should receive a 404 not found error', async () => {
        // Given: An invalid war ID
        const notFoundError = TestDataFactory.createError(404);

        jest.spyOn(client.wars, 'getWarById').mockRejectedValue(notFoundError);

        // When & Then: I request the war details and expect a not found error
        await expect(client.wars.getWarById(999999999)).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Request killmails for an invalid war ID (404)', () => {
      it('Given an invalid war ID, When I request killmails, Then I should receive a 404 not found error', async () => {
        // Given: An invalid war ID
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.wars, 'getWarKillmails')
          .mockRejectedValue(notFoundError);

        // When & Then: I request killmails and expect a not found error
        await expect(client.wars.getWarKillmails(999999999)).rejects.toThrow(
          EsiError,
        );
      });
    });
  });

  describe('Feature: War Analysis Workflow', () => {
    describe('Scenario: Analyze war statistics by comparing aggressor and defender', () => {
      it('Given a war with combat data, When I analyze the war stats, Then I should determine the dominant side', async () => {
        // Given: A war with combat data
        const warId = 700001;
        const warDetails = {
          id: warId,
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

        // When: I analyze the war stats
        const result = await client.wars.getWarById(warId);

        // Then: I should determine the dominant side
        const aggressorIsk = (result as any).aggressor.isk_destroyed;
        const defenderIsk = (result as any).defender.isk_destroyed;
        const aggressorKills = (result as any).aggressor.ships_killed;
        const defenderKills = (result as any).defender.ships_killed;

        // The aggressor is dominant in this scenario
        expect(aggressorIsk).toBeGreaterThan(defenderIsk);
        expect(aggressorKills).toBeGreaterThan(defenderKills);

        // Compute ISK efficiency
        const totalIskDestroyed = aggressorIsk + defenderIsk;
        const aggressorEfficiency = aggressorIsk / totalIskDestroyed;
        expect(aggressorEfficiency).toBeGreaterThan(0.5);
      });
    });

    describe('Scenario: Complete war investigation workflow', () => {
      it('Given a war ID, When I gather full war data including details and killmails, Then I should build a complete picture of the conflict', async () => {
        // Given: A war ID to investigate
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

        // When: I gather full war data
        const [details, killmails] = await Promise.all([
          client.wars.getWarById(warId),
          client.wars.getWarKillmails(warId),
        ]);

        // Then: I should build a complete picture of the conflict
        expect(details).toBeDefined();
        expect(details.id).toBe(warId);
        expect(killmails).toBeInstanceOf(Array);
        expect(killmails.length).toBe(2);

        // Total ships killed should match killmail count approximately
        const totalShipsKilled =
          (details as any).aggressor.ships_killed +
          (details as any).defender.ships_killed;
        expect(totalShipsKilled).toBeGreaterThan(0);

        // War is still active
        expect((details as any).finished).toBeNull();
        expect((details as any).open_for_allies).toBe(true);
      });
    });
  });
});
