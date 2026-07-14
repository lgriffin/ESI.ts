import { ApiClient } from '../../../src/core/ApiClient';
import { SovereigntyClient } from '../../../src/clients/SovereigntyClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

describe('SovereigntyClient', () => {
  let client: ApiClient;
  let sovereigntyClient: SovereigntyClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    sovereigntyClient = new SovereigntyClient(client);
  });

  it('should get sovereignty campaigns', async () => {
    const mockResponse = [
      {
        attacker_score: 0.6,
        campaign_id: 1,
        structure_id: 1018253388776,
        constellation_id: 20000125,
        defender_id: 2000001,
        defender_score: 0.4,
        event_type: 'tcu_defense',
        solar_system_id: 30000142,
        start_time: '2023-07-01T17:00:00Z',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      sovereigntyClient.getSovereigntyCampaigns(),
    );
    expect(Array.isArray(result)).toBe(true);
    result.forEach((campaign: any) => {
      expect(campaign).toHaveProperty('campaign_id');
      expect(typeof campaign.campaign_id).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/sovereignty/campaigns',
    );
  });

  it('should get sovereignty systems (combined route)', async () => {
    const mockResponse = {
      solar_systems: [
        {
          solar_system_id: 30000142,
          claim: {
            alliance: {
              alliance_id: 99000006,
              corporation_id: 98000002,
              claimed_since: '2020-10-08T00:38:16Z',
              is_capital_system: false,
              development: {
                activity_defense_multiplier: 4.5,
                military_level: 3,
                industrial_level: 2,
                strategic_level: 1,
              },
            },
          },
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      sovereigntyClient.getSovereigntySystems(),
    );
    expect(result).toHaveProperty('solar_systems');
    expect(Array.isArray(result.solar_systems)).toBe(true);
    result.solar_systems.forEach((system: any) => {
      expect(system).toHaveProperty('solar_system_id');
      expect(typeof system.solar_system_id).toBe('number');
      expect(system).toHaveProperty('claim');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/sovereignty/systems',
    );
  });

  describeClientErrors('SovereigntyClient', () =>
    sovereigntyClient.getSovereigntyCampaigns(),
  );
});
