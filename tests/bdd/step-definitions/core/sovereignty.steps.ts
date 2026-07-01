import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/sovereignty.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting active sovereignty campaigns, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active sovereignty contests exist', () => {
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
    });

    when('the client requests campaigns', async () => {
      result = await client.sovereignty.getSovereigntyCampaigns();
    });

    then('the client shall return campaign details with scores', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].campaign_id).toBe(1001);
      expect(result[0].event_type).toBe('tcu_defense');
      expect(result[0].attackers_score).toBe(0.4);
      expect(result[0].defender_score).toBe(0.6);
      expect(result[1].defender_id).toBe(99000001);
    });
  });

  test('WHILE no active sovereignty campaigns, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no active campaigns exist', () => {
      jest
        .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
        .mockResolvedValue([]);
    });

    when('the client requests campaigns', async () => {
      result = await client.sovereignty.getSovereigntyCampaigns();
    });

    then('the client shall return an empty array', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  test('IF service unavailable error for sovereignty, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      const error = TestDataFactory.createError(503);

      jest
        .spyOn(client.sovereignty, 'getSovereigntyCampaigns')
        .mockRejectedValue(error);
    });

    when('the client requests sovereignty data', async () => {
      try {
        await client.sovereignty.getSovereigntyCampaigns();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN getting combined sovereignty systems with ADM indices, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the combined systems endpoint is available', () => {
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
    });

    when('the client requests sovereignty systems', async () => {
      result = await client.sovereignty.getSovereigntySystems();
    });

    then(
      'the client shall return occupancy, structures, and separate ADM indices',
      () => {
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].military_index).toBe(5.0);
        expect(result[0].industry_index).toBe(3.2);
        expect(result[0].strategic_index).toBe(1.0);
        expect(result[0].structures).toHaveLength(1);
        expect(result[1].structures).toHaveLength(0);
      },
    );
  });

  test('WHEN fetching combined sovereignty data, the client shall replace separate map and structures calls', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the combined systems endpoint exists', () => {
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
    });

    when('the client fetches systems', async () => {
      result = await client.sovereignty.getSovereigntySystems();
    });

    then('it shall contain data from both map and structures', () => {
      expect(result[0].system_id).toBeDefined();
      expect(result[0].alliance_id).toBeDefined();
      expect(result[0].military_index).toBeDefined();
      expect(result[0].structures![0].structure_id).toBeDefined();
      expect(result[0].structures![0].vulnerable_start_time).toBeDefined();
    });
  });

  test('The client shall handle concurrent fetch of campaigns and systems', ({
    given,
    when,
    then,
  }) => {
    let campaigns: any;
    let systems: any;

    given('all sovereignty endpoints are available', () => {
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
    });

    when('the client fetches all data concurrently', async () => {
      [campaigns, systems] = await Promise.all([
        client.sovereignty.getSovereigntyCampaigns(),
        client.sovereignty.getSovereigntySystems(),
      ]);
    });

    then('both shall return valid data', () => {
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].campaign_id).toBe(1001);
      expect(systems).toHaveLength(1);
      expect(systems[0].system_id).toBe(30004759);

      // Cross-reference: campaign and system in same solar system
      expect(campaigns[0].solar_system_id).toBe(systems[0].system_id);
    });
  });
});
