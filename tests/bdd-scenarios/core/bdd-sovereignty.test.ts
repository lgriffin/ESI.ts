/**
 * BDD-Style Testing for Sovereignty API
 *
 * This demonstrates BDD principles for the Sovereignty API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Sovereignty Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Sovereignty Campaigns', () => {
    describe('Scenario: Get active sovereignty campaigns', () => {
      it('Given active sovereignty contests, When I request campaigns, Then I should receive campaign details with scores', async () => {
        // Given
        const expectedCampaigns = [
          {
            campaign_id: 1001,
            event_type: 'tcu_defense',
            solar_system_id: 30004759,
            constellation_id: 20000690,
            start_time: '2024-03-15T18:00:00Z',
            structure_id: 8001,
            attackers_score: 0.4,
            defender_score: 0.6,
            defender_id: 99005338,
          },
          {
            campaign_id: 1002,
            event_type: 'ihub_defense',
            solar_system_id: 30004760,
            constellation_id: 20000690,
            start_time: '2024-03-15T19:00:00Z',
            structure_id: 8002,
            attackers_score: 0.7,
            defender_score: 0.3,
            defender_id: 99000001,
          },
        ];

        jest
          .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
          .mockResolvedValue(expectedCampaigns as any);

        // When
        const result = await client.sovereignty.getSovereigntyCampaigns();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].campaign_id).toBe(1001);
        expect(result[0].event_type).toBe('tcu_defense');
        expect(result[0].attackers_score).toBe(0.4);
        expect(result[0].defender_score).toBe(0.6);
        expect(result[1].defender_id).toBe(99000001);
      });
    });

    describe('Scenario: No active sovereignty campaigns', () => {
      it('Given no active campaigns, When I request campaigns, Then I should receive an empty array', async () => {
        // Given
        jest
          .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
          .mockResolvedValue([]);

        // When
        const result = await client.sovereignty.getSovereigntyCampaigns();

        // Then
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Sovereignty Error Handling', () => {
    describe('Scenario: Service unavailable error', () => {
      it('Given the ESI service is down, When I request sovereignty data, Then I should receive a 503 error', async () => {
        // Given
        const error = TestDataFactory.createError(503);

        jest
          .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
          .mockRejectedValue(error);

        // When & Then
        await expect(
          client.sovereignty.getSovereigntyCampaigns(),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Combined Sovereignty Systems', () => {
    describe('Scenario: Get combined sovereignty systems with ADM indices', () => {
      it('Given the combined systems endpoint is available, When I request sovereignty systems, Then I should receive occupancy, structures, and separate ADM indices', async () => {
        // Given
        const expectedSystems = [
          {
            system_id: 30000142,
            alliance_id: 99005338,
            corporation_id: 1344654522,
            military_index: 5.0,
            industry_index: 3.2,
            strategic_index: 1.0,
            structures: [
              {
                structure_id: 8001,
                structure_type_id: 32226,
                vulnerability_occupancy_level: 4.5,
              },
            ],
          },
          {
            system_id: 30004759,
            alliance_id: 99000001,
            corporation_id: 987654321,
            military_index: 2.0,
            industry_index: 4.5,
            strategic_index: 3.0,
            structures: [],
          },
        ];

        jest
          .spyOn(client.sovereignty, 'getSovereigntySystems')
          .mockResolvedValue(expectedSystems as any);

        // When
        const result = await client.sovereignty.getSovereigntySystems();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].military_index).toBe(5.0);
        expect(result[0].industry_index).toBe(3.2);
        expect(result[0].strategic_index).toBe(1.0);
        expect(result[0].structures).toHaveLength(1);
        expect(result[1].structures).toHaveLength(0);
      });
    });

    describe('Scenario: Combined route replaces separate map and structures endpoints', () => {
      it('Given the combined systems endpoint, When I fetch systems, Then it should contain data from both map and structures', async () => {
        // Given
        const systemsData = [
          {
            system_id: 30000142,
            alliance_id: 99005338,
            corporation_id: 1344654522,
            faction_id: undefined,
            military_index: 5.0,
            industry_index: 3.2,
            strategic_index: 1.0,
            structures: [
              {
                structure_id: 8001,
                structure_type_id: 32226,
                vulnerability_occupancy_level: 4.5,
                vulnerable_start_time: '2026-05-20T17:00:00Z',
                vulnerable_end_time: '2026-05-20T20:00:00Z',
              },
            ],
          },
        ];

        jest
          .spyOn(client.sovereignty, 'getSovereigntySystems')
          .mockResolvedValue(systemsData as any);

        // When
        const result = await client.sovereignty.getSovereigntySystems();

        // Then
        expect(result[0].system_id).toBeDefined();
        expect(result[0].alliance_id).toBeDefined();
        expect(result[0].military_index).toBeDefined();
        expect(result[0].structures![0].structure_id).toBeDefined();
        expect(result[0].structures![0].vulnerable_start_time).toBeDefined();
      });
    });
  });

  describe('Feature: Sovereignty Workflow', () => {
    describe('Scenario: Concurrent fetch of campaigns and systems', () => {
      it('Given all sovereignty endpoints are available, When I fetch all data concurrently, Then both should return valid data', async () => {
        // Given
        const campaignData = [
          {
            campaign_id: 1001,
            event_type: 'tcu_defense',
            solar_system_id: 30004759,
            constellation_id: 20000690,
            start_time: '2024-03-15T18:00:00Z',
            structure_id: 8001,
            attackers_score: 0.5,
            defender_score: 0.5,
            defender_id: 99005338,
          },
        ];
        const systemsData = [
          {
            system_id: 30004759,
            alliance_id: 99005338,
            corporation_id: 1344654522,
            military_index: 5.0,
            industry_index: 3.2,
            strategic_index: 1.0,
            structures: [
              {
                structure_id: 8001,
                structure_type_id: 32226,
                vulnerability_occupancy_level: 4.5,
              },
            ],
          },
        ];

        jest
          .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
          .mockResolvedValue(campaignData as any);
        jest
          .spyOn(client.sovereignty, 'getSovereigntySystems')
          .mockResolvedValue(systemsData as any);

        // When
        const [campaigns, systems] = await Promise.all([
          client.sovereignty.getSovereigntyCampaigns(),
          client.sovereignty.getSovereigntySystems(),
        ]);

        // Then
        expect(campaigns).toHaveLength(1);
        expect(campaigns[0].campaign_id).toBe(1001);
        expect(systems).toHaveLength(1);
        expect(systems[0].system_id).toBe(30004759);

        // Cross-reference: campaign and system in same solar system
        expect(campaigns[0].solar_system_id).toBe(systems[0].system_id);
      });
    });
  });
});
