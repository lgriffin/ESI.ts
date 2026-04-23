/**
 * BDD-Style Tests for FactionClient
 *
 * Tests faction warfare operations including overall stats, character/corporation
 * stats, systems, wars, leaderboards, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Faction Warfare Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Faction Warfare Stats', () => {
    describe('Scenario: Get overall faction warfare statistics', () => {
      it('Given the FW system is active, When I request faction warfare stats, Then I should receive stats for all factions', async () => {
        // Given: The FW system is active
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

        jest
          .spyOn(client.factions, 'getStats')
          .mockResolvedValue(expectedStats);

        // When: I request faction warfare stats
        const result = await client.factions.getStats();

        // Then: I should receive stats for all factions
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
  });

  describe('Feature: Retrieve Character Faction Warfare Stats', () => {
    describe('Scenario: Get FW stats for an enlisted character', () => {
      it('Given a character enlisted in faction warfare, When I request character FW stats, Then I should receive their personal statistics', async () => {
        // Given: A character enlisted in faction warfare
        const characterId = 1689391488;
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

        // When: I request character FW stats
        const result = await client.factions.getCharacterStats(characterId);

        // Then: I should receive their personal statistics
        expect(result).toBeDefined();
        expect(result).toHaveProperty('faction_id', 500001);
        expect(result).toHaveProperty('enlisted_on');
        expect(result).toHaveProperty('current_rank', 5);
        expect(result).toHaveProperty('highest_rank', 7);
        expect(result).toHaveProperty('kills');
        expect(result.kills.total).toBe(500);
      });
    });

    describe('Scenario: Handle unauthorized access for character FW stats', () => {
      it('Given an invalid or expired token, When I request character FW stats, Then I should receive a 403 forbidden error', async () => {
        // Given: An invalid or expired token
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.factions, 'getCharacterStats')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request character FW stats and expect a forbidden error
        await expect(
          client.factions.getCharacterStats(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Corporation Faction Warfare Stats', () => {
    describe('Scenario: Get FW stats for an enlisted corporation', () => {
      it('Given a corporation enlisted in faction warfare, When I request corporation FW stats, Then I should receive the corporation statistics', async () => {
        // Given: A corporation enlisted in faction warfare
        const corporationId = 1344654522;
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

        // When: I request corporation FW stats
        const result = await client.factions.getCorporationStats(corporationId);

        // Then: I should receive the corporation statistics
        expect(result).toBeDefined();
        expect(result).toHaveProperty('faction_id', 500001);
        expect(result).toHaveProperty('enlisted_on');
        expect(result).toHaveProperty('pilots', 250);
        expect(result).toHaveProperty('kills');
        expect(result.kills.total).toBe(15000);
      });
    });

    describe('Scenario: Handle unauthorized access for corporation FW stats', () => {
      it('Given an invalid or expired token, When I request corporation FW stats, Then I should receive a 403 forbidden error', async () => {
        // Given: An invalid or expired token
        const corporationId = 1344654522;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.factions, 'getCorporationStats')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request corporation FW stats and expect a forbidden error
        await expect(
          client.factions.getCorporationStats(corporationId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Faction Warfare Systems', () => {
    describe('Scenario: Get current ownership of FW systems', () => {
      it('Given active faction warfare, When I request FW systems, Then I should receive system ownership and contested status', async () => {
        // Given: Active faction warfare
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

        // When: I request FW systems
        const result = await client.factions.getSystems();

        // Then: I should receive system ownership and contested status
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('solar_system_id');
        expect(result[0]).toHaveProperty('owner_faction_id');
        expect(result[0]).toHaveProperty('contested', 'uncontested');
        expect(result[1]).toHaveProperty('contested', 'contested');
        expect(result[1].victory_points).toBe(1500);
      });
    });
  });

  describe('Feature: Retrieve Faction Warfare Wars', () => {
    describe('Scenario: Get list of active FW wars', () => {
      it('Given faction warfare is active, When I request FW wars, Then I should receive the list of faction conflicts', async () => {
        // Given: Faction warfare is active
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

        // When: I request FW wars
        const result = await client.factions.getWars();

        // Then: I should receive the list of faction conflicts
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('aggressor_id', 500001);
        expect(result[0]).toHaveProperty('defender_id', 500002);
        expect(result[1]).toHaveProperty('aggressor_id', 500003);
        expect(result[1]).toHaveProperty('defender_id', 500004);
      });
    });
  });

  describe('Feature: Retrieve Faction Warfare Leaderboards', () => {
    describe('Scenario: Get overall FW leaderboard', () => {
      it('Given faction warfare is active, When I request the overall leaderboard, Then I should receive faction rankings', async () => {
        // Given: Faction warfare is active
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

        // When: I request the overall leaderboard
        const result = await client.factions.getLeaderboardsOverall();

        // Then: I should receive faction rankings
        expect(result).toBeDefined();
        expect(result).toHaveProperty('kills');
        expect(result).toHaveProperty('victory_points');
        expect(result.kills.yesterday).toBeInstanceOf(Array);
        expect(result.kills.yesterday[0]).toHaveProperty('faction_id');
        expect(result.kills.yesterday[0]).toHaveProperty('amount');
      });
    });

    describe('Scenario: Get character FW leaderboard', () => {
      it('Given faction warfare is active, When I request the character leaderboard, Then I should receive top character rankings', async () => {
        // Given: Faction warfare is active
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

        // When: I request the character leaderboard
        const result = await client.factions.getLeaderboardsCharacters();

        // Then: I should receive top character rankings
        expect(result).toBeDefined();
        expect(result).toHaveProperty('kills');
        expect(result.kills.yesterday).toBeInstanceOf(Array);
        expect(result.kills.yesterday[0]).toHaveProperty('character_id');
        expect(result.kills.yesterday[0]).toHaveProperty('amount', 25);
      });
    });
  });

  describe('Feature: Integration Workflows', () => {
    describe('Scenario: Complete faction warfare overview', () => {
      it('Given an enlisted character, When I gather all FW data concurrently, Then I should have a complete faction warfare picture', async () => {
        // Given: An enlisted character
        const characterId = 1689391488;
        const corporationId = 1344654522;

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

        // When: I gather all FW data concurrently
        const [
          factionStats,
          characterStats,
          corporationStats,
          fwSystems,
          fwWars,
        ] = await Promise.all([
          client.factions.getStats(),
          client.factions.getCharacterStats(characterId),
          client.factions.getCorporationStats(corporationId),
          client.factions.getSystems(),
          client.factions.getWars(),
        ]);

        // Then: I should have a complete faction warfare picture
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
});
