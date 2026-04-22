import { AllianceClient } from '../../../src/clients/AllianceClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('withMetadata()', () => {
  let apiClient: ApiClient;
  let allianceClient: AllianceClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    resetETagCache();
    RateLimiter.getInstance().reset();
    apiClient = new ApiClient('https://esi.evetech.net', 'test-client');
    allianceClient = new AllianceClient(apiClient);
  });

  it('returns the same withMetadata instance on repeated calls', () => {
    const meta1 = allianceClient.withMetadata();
    const meta2 = allianceClient.withMetadata();
    expect(meta1).toBe(meta2);
  });

  it('wraps response body with data and meta fields', async () => {
    const mockAlliance = {
      alliance_id: 99000001,
      name: 'Test Alliance',
      ticker: 'TEST',
      creator_id: 123,
      creator_corporation_id: 456,
      date_founded: '2020-01-01T00:00:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockAlliance), {
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '95',
        'x-ratelimit-limit': '100',
      },
    });

    const metaClient = allianceClient.withMetadata();
    const result = await metaClient.getAllianceById(99000001);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(result.data).toEqual(mockAlliance);
    expect(result.meta).toHaveProperty('headers');
    expect(result.meta).toHaveProperty('fromCache');
    expect(result.meta).toHaveProperty('stale');
    expect(result.meta.fromCache).toBe(false);
    expect(result.meta.stale).toBe(false);
    expect(typeof result.meta.headers).toBe('object');
  });

  it('normal client still returns unwrapped data', async () => {
    const mockAlliances = [99000001, 99000002];

    fetchMock.mockResponseOnce(JSON.stringify(mockAlliances), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await allianceClient.getAlliances();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(mockAlliances);
    expect(result).not.toHaveProperty('meta');
  });
});
