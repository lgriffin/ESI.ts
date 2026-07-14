import { ApiClient } from '../../../src/core/ApiClient';
import { MercenaryClient } from '../../../src/clients/MercenaryClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

describe('MercenaryClient', () => {
  let client: ApiClient;
  let mercenaryClient: MercenaryClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    mercenaryClient = new MercenaryClient(client);
  });

  it('should get mercenary dens', async () => {
    const mockResponse = [
      {
        den_id: 5001,
        system_id: 30000142,
        constellation_id: 20000125,
        region_id: 10000002,
        development_level: 3,
        anarchy_level: 2,
        active_operations: 1,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => mercenaryClient.getMercenaryDens());
    expect(Array.isArray(result)).toBe(true);
    result.forEach((den: any) => {
      expect(den).toHaveProperty('den_id');
      expect(typeof den.den_id).toBe('number');
      expect(den).toHaveProperty('system_id');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/mercenary/dens',
    );
  });

  it('should get mercenary tactical operations', async () => {
    const mockResponse = [
      {
        operation_id: 7001,
        den_id: 5001,
        system_id: 30000142,
        site_type: 'assault',
        status: 'active',
        started_at: '2026-05-20T10:00:00Z',
        expires_at: '2026-05-20T22:00:00Z',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      mercenaryClient.getMercenaryTacticalOperations(),
    );
    expect(Array.isArray(result)).toBe(true);
    result.forEach((op: any) => {
      expect(op).toHaveProperty('operation_id');
      expect(typeof op.operation_id).toBe('number');
      expect(op).toHaveProperty('status');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/mercenary/operations',
    );
  });

  describeClientErrors('MercenaryClient', () =>
    mercenaryClient.getMercenaryDens(),
  );
});
