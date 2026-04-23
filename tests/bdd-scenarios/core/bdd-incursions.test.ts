/**
 * BDD-Style Tests for Incursion Management
 *
 * Tests the IncursionsClient for retrieving active incursion data,
 * including various states and error conditions.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Incursion Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Active Incursions', () => {
    describe('Scenario: List all active incursions', () => {
      it('Given active incursions exist in the universe, When I request the incursion list, Then I should receive complete incursion details', async () => {
        // Given
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

        // When
        const result = await client.incursions.getIncursions();

        // Then
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

    describe('Scenario: No active incursions', () => {
      it('Given no incursions are active in the universe, When I request the incursion list, Then I should receive an empty array', async () => {
        // Given
        jest.spyOn(client.incursions, 'getIncursions').mockResolvedValue([]);

        // When
        const result = await client.incursions.getIncursions();

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });

    describe('Scenario: Incursion in withdrawing state', () => {
      it('Given an incursion in the withdrawing state, When I request the incursion list, Then the incursion should show zero influence and no boss', async () => {
        // Given
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

        // When
        const result = await client.incursions.getIncursions();

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].state).toBe('withdrawing');
        expect(result[0].influence).toBe(0.0);
        expect(result[0].has_boss).toBe(false);
      });
    });

    describe('Scenario: Multiple incursions across different constellations', () => {
      it('Given multiple incursions in different regions, When I request the list, Then each should have unique constellation and staging system IDs', async () => {
        // Given
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

        // When
        const result = await client.incursions.getIncursions();

        // Then
        expect(result).toHaveLength(3);

        const constellationIds = result.map((i) => i.constellation_id);
        const uniqueConstellations = new Set(constellationIds);
        expect(uniqueConstellations.size).toBe(3);

        const stagingIds = result.map((i) => i.staging_solar_system_id);
        const uniqueStaging = new Set(stagingIds);
        expect(uniqueStaging.size).toBe(3);
      });
    });
  });

  describe('Feature: Error Handling', () => {
    describe('Scenario: ESI service unavailable', () => {
      it('Given the ESI service is experiencing downtime, When I request incursions, Then I should receive a 503 service unavailable error', async () => {
        // Given
        const serviceUnavailableError = TestDataFactory.createError(503);

        jest
          .spyOn(client.incursions, 'getIncursions')
          .mockRejectedValue(serviceUnavailableError);

        // When & Then
        await expect(client.incursions.getIncursions()).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Server error during incursion retrieval', () => {
      it('Given an internal server error occurs, When I request incursions, Then the error should indicate a server-side issue', async () => {
        // Given
        const serverError = TestDataFactory.createError(500);

        jest
          .spyOn(client.incursions, 'getIncursions')
          .mockRejectedValue(serverError);

        // When & Then
        try {
          await client.incursions.getIncursions();
          fail('Expected an error to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(EsiError);
          expect((error as EsiError).statusCode).toBe(500);
          expect((error as EsiError).isServerError()).toBe(true);
        }
      });
    });
  });

  describe('Feature: Incursion Data Validation', () => {
    describe('Scenario: Verify incursion influence is within expected bounds', () => {
      it('Given active incursions with varying influence, When I examine the results, Then all influence values should be between 0 and 1', async () => {
        // Given
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

        // When
        const result = await client.incursions.getIncursions();

        // Then
        for (const incursion of result) {
          expect(incursion.influence).toBeGreaterThanOrEqual(0);
          expect(incursion.influence).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
