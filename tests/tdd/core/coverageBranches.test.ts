import { ApiClient } from '../../../src/core/ApiClient';
import { BaseEsiClient } from '../../../src/clients/BaseEsiClient';
import { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiClient } from '../../../src/EsiClient';
import { CustomEsiClient, EsiApiFactory } from '../../../src/EsiClientBuilder';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const testEndpoints = {
  getItems: {
    path: 'test/items/',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;

class TestClient extends BaseEsiClient<typeof testEndpoints> {
  constructor(client: ApiClient) {
    super(client, testEndpoints);
  }
}

describe('BaseEsiClient branch coverage', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('test', 'https://esi.evetech.net', 'token');
    apiClient.setRateLimiter(rateLimiter);
  });

  it('withSafeMode should return cached instance on second call', () => {
    const client = new TestClient(apiClient);
    const safe1 = client.withSafeMode();
    const safe2 = client.withSafeMode();
    expect(safe1).toBe(safe2);
  });

  it('withMetadata should return cached instance on second call', () => {
    const client = new TestClient(apiClient);
    const meta1 = client.withMetadata();
    const meta2 = client.withMetadata();
    expect(meta1).toBe(meta2);
  });
});

describe('EsiClient batch methods', () => {
  let client: EsiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new EsiClient();
  });

  afterEach(() => {
    client.shutdown();
  });

  it('batch should delegate to batchFetch', async () => {
    const fetcher = jest.fn().mockResolvedValue('result');
    const result = await client.batch([1, 2], fetcher);
    expect(result.results.size).toBe(2);
  });

  it('batchPost should delegate to batchPost utility', async () => {
    const poster = jest.fn().mockResolvedValue([{ id: 1 }]);
    const result = await client.batchPost([1], poster);
    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('EsiApiFactory branch coverage', () => {
  it('should create client without optional config fields', () => {
    const client = EsiApiFactory.createAllianceClient();
    expect(client).toBeDefined();
  });

  it('should create client with language config', () => {
    const client = EsiApiFactory.createAllianceClient({ language: 'de' });
    expect(client).toBeDefined();
  });

  it('should create client with datasource config', () => {
    const client = EsiApiFactory.createAllianceClient({
      datasource: 'singularity',
    });
    expect(client).toBeDefined();
  });

  it('should create client with onTokenRefresh config', () => {
    const client = EsiApiFactory.createAllianceClient({
      onTokenRefresh: async () => 'new-token',
    });
    expect(client).toBeDefined();
  });

  it('should create client with all optional config fields', () => {
    const client = EsiApiFactory.createAllianceClient({
      language: 'fr',
      datasource: 'singularity',
      onTokenRefresh: async () => 'token',
    });
    expect(client).toBeDefined();
  });
});

describe('CustomEsiClient branch coverage', () => {
  it('should build without optional config fields', () => {
    const client = new CustomEsiClient({ clients: ['alliance'] });
    expect(client).toBeDefined();
    client.shutdown();
  });

  it('should build with language config', () => {
    const client = new CustomEsiClient({
      clients: ['alliance'],
      language: 'de',
    });
    expect(client).toBeDefined();
    client.shutdown();
  });

  it('should build with datasource config', () => {
    const client = new CustomEsiClient({
      clients: ['alliance'],
      datasource: 'singularity',
    });
    expect(client).toBeDefined();
    client.shutdown();
  });

  it('should build with onTokenRefresh config', () => {
    const client = new CustomEsiClient({
      clients: ['alliance'],
      onTokenRefresh: async () => 'new-token',
    });
    expect(client).toBeDefined();
    client.shutdown();
  });
});
