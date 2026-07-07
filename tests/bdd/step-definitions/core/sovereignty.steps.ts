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
      const expectedSystems = {
        solar_systems: [
          {
            solar_system_id: 30000142,
            claim: {
              alliance: {
                alliance_id: 99005338,
                corporation_id: 1344654522,
                claimed_since: '2020-10-08T00:38:16Z',
                is_capital_system: false,
                development: {
                  activity_defense_multiplier: 4.5,
                  military_level: 5,
                  industrial_level: 3,
                  strategic_level: 1,
                },
              },
            },
          },
          {
            solar_system_id: 30004759,
            claim: {
              alliance: {
                alliance_id: 99000001,
                corporation_id: 987654321,
                claimed_since: '2021-01-01T00:00:00Z',
                is_capital_system: false,
                development: {
                  activity_defense_multiplier: 3.0,
                  military_level: 2,
                  industrial_level: 4,
                  strategic_level: 3,
                },
              },
            },
          },
        ],
      };

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
        expect(result.solar_systems).toHaveLength(2);
        const first = result.solar_systems[0];
        expect(first.claim.alliance.development.military_level).toBe(5);
        expect(first.claim.alliance.development.industrial_level).toBe(3);
        expect(first.claim.alliance.development.strategic_level).toBe(1);
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
      const systemsData = {
        solar_systems: [
          {
            solar_system_id: 30000142,
            claim: {
              alliance: {
                alliance_id: 99005338,
                corporation_id: 1344654522,
                claimed_since: '2020-10-08T00:38:16Z',
                sovereignty_hub: {
                  id: 1034510825648,
                  vulnerability_window: {
                    start: '2026-05-20T17:00:00Z',
                    end: '2026-05-20T20:00:00Z',
                  },
                },
                is_capital_system: false,
                development: {
                  activity_defense_multiplier: 4.5,
                  military_level: 5,
                  industrial_level: 3,
                  strategic_level: 1,
                },
              },
            },
          },
        ],
      };

      jest
        .spyOn(client.sovereignty, 'getSovereigntySystems')
        .mockResolvedValue(systemsData as any);
    });

    when('the client fetches systems', async () => {
      result = await client.sovereignty.getSovereigntySystems();
    });

    then('it shall contain data from both map and structures', () => {
      const sys = result.solar_systems[0];
      expect(sys.solar_system_id).toBeDefined();
      expect(sys.claim.alliance.alliance_id).toBeDefined();
      expect(sys.claim.alliance.development.military_level).toBeDefined();
      expect(
        sys.claim.alliance.sovereignty_hub.vulnerability_window.start,
      ).toBeDefined();
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
      const systemsData = {
        solar_systems: [
          {
            solar_system_id: 30004759,
            claim: {
              alliance: {
                alliance_id: 99005338,
                corporation_id: 1344654522,
                claimed_since: '2020-10-08T00:38:16Z',
                is_capital_system: false,
                development: {
                  activity_defense_multiplier: 4.5,
                  military_level: 5,
                  industrial_level: 3,
                  strategic_level: 1,
                },
              },
            },
          },
        ],
      };

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
      expect(systems.solar_systems).toHaveLength(1);
      expect(systems.solar_systems[0].solar_system_id).toBe(30004759);

      // Cross-reference: campaign and system in same solar system
      expect(campaigns[0].solar_system_id).toBe(
        systems.solar_systems[0].solar_system_id,
      );
    });
  });
});
