import { ApiClient } from '../../../src/core/ApiClient';
import { SkyhooksClient } from '../../../src/clients/SkyhooksClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

describe('SkyhooksClient', () => {
  let client: ApiClient;
  let skyhooksClient: SkyhooksClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    skyhooksClient = new SkyhooksClient(client);
  });

  it('should get sovereignty hubs', async () => {
    const mockResponse = [
      {
        structure_id: 100000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        remaining_reagents: 500,
        installed_upgrades: [1, 2, 3],
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => skyhooksClient.getSovereigntyHubs());
    expect(Array.isArray(result)).toBe(true);
    result.forEach((hub: any) => {
      expect(hub).toHaveProperty('structure_id');
      expect(typeof hub.structure_id).toBe('number');
      expect(hub).toHaveProperty('online');
      expect(typeof hub.online).toBe('boolean');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/sovereignty/hubs',
    );
  });

  it('should get orbital skyhooks', async () => {
    const mockResponse = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        reagent_silo_capacity: 1000,
        reagent_silo_level: 750,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => skyhooksClient.getOrbitalSkyhooks());
    expect(Array.isArray(result)).toBe(true);
    result.forEach((skyhook: any) => {
      expect(skyhook).toHaveProperty('structure_id');
      expect(typeof skyhook.structure_id).toBe('number');
      expect(skyhook).toHaveProperty('online');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/sovereignty/skyhooks',
    );
  });

  it('should get raidable skyhooks', async () => {
    const mockResponse = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        raidable_at: '2026-05-20T12:00:00Z',
        is_raidable: true,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => skyhooksClient.getRaidableSkyhooks());
    expect(Array.isArray(result)).toBe(true);
    result.forEach((skyhook: any) => {
      expect(skyhook).toHaveProperty('structure_id');
      expect(typeof skyhook.structure_id).toBe('number');
      expect(skyhook).toHaveProperty('is_raidable');
      expect(typeof skyhook.is_raidable).toBe('boolean');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/sovereignty/skyhooks/raidable',
    );
  });

  describeClientErrors('SkyhooksClient', () =>
    skyhooksClient.getSovereigntyHubs(),
  );
});
