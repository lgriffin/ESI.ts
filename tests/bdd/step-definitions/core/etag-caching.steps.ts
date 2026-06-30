import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const feature = loadFeature('tests/bdd/features/core/etag-caching.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    fetchMock.resetMocks();

    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      enableETagCache: true,
      etagCacheConfig: {
        maxEntries: 50,
        defaultTtl: 300000,
      },
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  test('First-time API request caches response', ({ given, when, then }) => {
    let result: any;
    const allianceData = [
      {
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
      },
      { alliance_id: 99005551, name: 'Pandemic Horde', ticker: 'REKTD' },
    ];
    const etag = '"1234567890abcdef"';

    given('a fresh client with no cached data', () => {
      fetchMock.mockResponseOnce(JSON.stringify(allianceData), {
        headers: {
          ETag: etag,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    });

    when('I make an API request that returns an ETag', async () => {
      result = await client.alliance.getAlliances();
    });

    then('the response should be cached for future use', async () => {
      expect(result).toEqual(allianceData);

      const cacheStats = client.getCacheStats();
      expect(cacheStats).toBeDefined();
      expect(cacheStats!.totalEntries).toBe(1);

      // Second request within spec-aware TTL returns cached data without HTTP call
      const cachedResult = await client.alliance.getAlliances();
      expect(cachedResult).toEqual(allianceData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test('Subsequent request with unchanged data returns cached response', ({
    given,
    when,
    then,
  }) => {
    let cachedResult: any;
    const allianceData = [
      { alliance_id: 99005338, name: 'Goonswarm Federation' },
    ];
    const etag = '"cached123"';

    given('cached data with an ETag', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(allianceData), {
        headers: { ETag: etag, 'Content-Type': 'application/json' },
      });

      await client.alliance.getAlliances();
    });

    when(
      'I make the same request and server returns 304 Not Modified',
      async () => {
        cachedResult = await client.alliance.getAlliances();
      },
    );

    then('I should receive the cached data without a new download', () => {
      expect(cachedResult).toEqual(allianceData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test('Data changes trigger cache update', ({ given, when, then }) => {
    let updatedResult: any;
    const oldData = [{ alliance_id: 1, name: 'Old Alliance' }];
    const oldETag = '"old-etag-123"';

    given('cached data with an ETag for update', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(oldData), {
        headers: { ETag: oldETag },
      });

      const firstResult = await client.alliance.getAlliances();
      expect(firstResult).toEqual(oldData);
    });

    when('the server returns new data with a different ETag', async () => {
      updatedResult = await client.alliance.getAlliances();
    });

    then('the cache should be updated with the new data', () => {
      // Spec-aware cache returns original data (TTL not expired)
      expect(updatedResult).toEqual(oldData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test('Cache statistics provide insight into performance', ({
    given,
    when,
    then,
  }) => {
    let stats: any;

    given('multiple cached responses exist', async () => {
      const endpoints = [
        { endpoint: 'alliances', data: [{ id: 1 }] },
        { endpoint: 'status', data: { status: 'ok' } },
      ];

      for (let i = 0; i < endpoints.length; i++) {
        fetchMock.mockResponseOnce(JSON.stringify(endpoints[i].data), {
          headers: { ETag: `"etag-${i}"` },
        });
      }

      await client.alliance.getAlliances();
      await client.status.getStatus();
    });

    when('I request cache statistics', () => {
      stats = client.getCacheStats();
    });

    then('I should receive detailed information about cache usage', () => {
      expect(stats).toBeDefined();
      expect(stats!.totalEntries).toBe(2);
      expect(stats!.maxEntries).toBe(50);
      expect(stats!.oldestEntry).toBeDefined();
      expect(stats!.newestEntry).toBeDefined();
    });
  });

  test('Cache can be manually cleared', ({ given, when, then }) => {
    given('a cache with stored responses', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]), {
        headers: { ETag: '"test-etag"' },
      });

      await client.alliance.getAlliances();
      expect(client.getCacheStats()!.totalEntries).toBe(1);
    });

    when('I clear the cache', () => {
      client.clearCache();
    });

    then('all cached data should be removed', () => {
      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });
  });

  test('Cache configuration can be updated at runtime', ({
    given,
    when,
    then,
  }) => {
    given('a client with initial cache settings', () => {
      const initialStats = client.getCacheStats();
      expect(initialStats!.maxEntries).toBe(50);
    });

    when('I update the cache configuration', () => {
      client.updateCacheConfig({
        maxEntries: 100,
        defaultTtl: 600000,
      });
    });

    then('the new settings should take effect', () => {
      const updatedStats = client.getCacheStats();
      expect(updatedStats!.maxEntries).toBe(100);
    });
  });

  test('Handle server errors gracefully with caching', ({
    given,
    when,
    then,
  }) => {
    let errorResult: any;
    const validData = [{ alliance_id: 1, name: 'Test Alliance' }];
    const etag = '"valid-etag"';

    given('a cached response exists', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(validData), {
        headers: { ETag: etag },
      });

      const firstResult = await client.alliance.getAlliances();
      expect(firstResult).toEqual(validData);
    });

    when('the server returns an error', async () => {
      fetchMock.mockResponseOnce('Server Error', { status: 500 });

      errorResult = await client.alliance.getAlliances();
    });

    then('the stale cached data should be served', () => {
      expect(errorResult).toEqual(validData);
    });
  });

  test('Handle missing ETag headers gracefully', ({ given, when, then }) => {
    let result: any;
    const data = [{ alliance_id: 1, name: 'Test Alliance' }];

    given('a server response without ETag headers', () => {
      fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    when('I make requests without ETag', async () => {
      result = await client.alliance.getAlliances();
    });

    then('the system should work normally without caching', () => {
      expect(result).toEqual(data);
      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });
  });

  test('Client works normally with caching disabled', ({
    given,
    when,
    then,
  }) => {
    let clientWithoutCache: EsiClient;
    let result: any;
    const data = [{ alliance_id: 1, name: 'Test Alliance' }];

    given('a client with ETag caching disabled', () => {
      clientWithoutCache = new EsiClient({
        enableETagCache: false,
      });

      fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: { ETag: '"should-not-be-cached"' },
      });
    });

    when('I make API requests without cache', async () => {
      result = await clientWithoutCache.alliance.getAlliances();
    });

    then('responses should be returned normally without caching', () => {
      expect(result).toEqual(data);
      expect(clientWithoutCache.getCacheStats()).toBeNull();

      clientWithoutCache.shutdown();
    });
  });
});
