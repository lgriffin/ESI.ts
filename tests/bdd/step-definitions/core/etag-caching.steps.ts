import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import type { EsiResponse } from '../../../../src/types/api-responses';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const feature = loadFeature(
  'tests/bdd/features/core/0050-etag-caching.feature',
);

// ---------------------------------------------------------------------------
// Stale-on-error fixtures
// ---------------------------------------------------------------------------

/** GET dogma/attributes has no spec cache TTL, so a cached entry is revalidated. */
const DOGMA_ATTRIBUTE_IDS = [2, 3, 4];
const DOGMA_ATTRIBUTES_ETAG = '"dogma-attributes-v1"';

/** The library's default attempt count, with backoff shrunk to milliseconds. */
const FAST_RETRY = { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2 };

function createStaleOnErrorClient(): EsiClient {
  return new EsiClient({
    clientId: 'bdd-stale-on-error',
    baseUrl: 'https://esi.evetech.net',
    enableETagCache: true,
    etagCacheConfig: { maxEntries: 50, defaultTtl: 300000 },
    retryConfig: FAST_RETRY,
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
}

async function cacheDogmaAttributeIndex(client: EsiClient): Promise<void> {
  fetchMock.mockResponseOnce(JSON.stringify(DOGMA_ATTRIBUTE_IDS), {
    headers: {
      ETag: DOGMA_ATTRIBUTES_ETAG,
      'Content-Type': 'application/json',
    },
  });
  await client.dogma.getAttributes();
  expect(client.getCacheStats()!.totalEntries).toBe(1);
}

function queueErrorResponse(status: number, times = 1): void {
  for (let i = 0; i < times; i++) {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'upstream failure' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function captureRejection(call: Promise<unknown>): Promise<unknown> {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to reject, but it resolved');
}

function expectEsiError(error: unknown, status: number): void {
  expect(error).toBeInstanceOf(EsiError);
  expect((error as EsiError).statusCode).toBe(status);
}

function requestHeader(call: number, name: string): string | undefined {
  const init = fetchMock.mock.calls[call]?.[1];
  return (init?.headers as Record<string, string> | undefined)?.[name];
}

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

  test('First response carrying an ETag is stored in the cache', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const allianceData = [99005338, 99005551];
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

    when('the client makes an API request that returns an ETag', async () => {
      result = await client.alliance.getAlliances();
    });

    then('the response shall be cached for future use', async () => {
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

  test('Repeat request inside the TTL window is served from the cache', ({
    given,
    when,
    then,
  }) => {
    let cachedResult: any;
    const allianceData = [99005338];
    const etag = '"cached123"';

    given('cached data with an ETag', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(allianceData), {
        headers: { ETag: etag, 'Content-Type': 'application/json' },
      });

      await client.alliance.getAlliances();
    });

    when(
      'the client repeats the same request inside the TTL window',
      async () => {
        cachedResult = await client.alliance.getAlliances();
      },
    );

    then(
      'the client shall return the cached data without a new download',
      () => {
        expect(cachedResult).toEqual(allianceData);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );
  });

  test('Repeat request inside the TTL window does not observe changed server data', ({
    given,
    when,
    then,
  }) => {
    let updatedResult: any;
    const oldData = [99005338];
    const oldETag = '"old-etag-123"';

    given('cached data with an ETag for update', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(oldData), {
        headers: { ETag: oldETag },
      });

      const firstResult = await client.alliance.getAlliances();
      expect(firstResult).toEqual(oldData);
    });

    when('the server would return new data with a different ETag', async () => {
      updatedResult = await client.alliance.getAlliances();
    });

    then('the client shall return the originally cached data', () => {
      // Spec-aware cache returns original data (TTL not expired)
      expect(updatedResult).toEqual(oldData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test('Cache statistics report entry counts and age bounds', ({
    given,
    when,
    then,
  }) => {
    let stats: any;

    given('multiple cached responses exist', async () => {
      const endpoints = [
        { endpoint: 'alliances', data: [99005338] },
        {
          endpoint: 'status',
          data: {
            players: 12345,
            server_version: '1.0',
            start_time: '2024-01-01T00:00:00Z',
          },
        },
      ];

      for (let i = 0; i < endpoints.length; i++) {
        fetchMock.mockResponseOnce(JSON.stringify(endpoints[i].data), {
          headers: { ETag: `"etag-${i}"` },
        });
      }

      await client.alliance.getAlliances();
      await client.status.getStatus();
    });

    when('the client requests cache statistics', () => {
      stats = client.getCacheStats();
    });

    then(
      'the client shall return detailed information about cache usage',
      () => {
        expect(stats).toBeDefined();
        expect(stats!.totalEntries).toBe(2);
        expect(stats!.maxEntries).toBe(50);
        expect(stats!.oldestEntry).toBeDefined();
        expect(stats!.newestEntry).toBeDefined();
      },
    );
  });

  test('Clearing the cache removes every stored entry', ({
    given,
    when,
    then,
  }) => {
    given('a cache with stored responses', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]), {
        headers: { ETag: '"test-etag"' },
      });

      await client.alliance.getAlliances();
      expect(client.getCacheStats()!.totalEntries).toBe(1);
    });

    when('the client clears the cache', () => {
      client.clearCache();
    });

    then('all cached data shall be removed', () => {
      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });
  });

  test('Updated maximum entry count is reflected in statistics', ({
    given,
    when,
    then,
  }) => {
    given('a client with initial cache settings', () => {
      const initialStats = client.getCacheStats();
      expect(initialStats!.maxEntries).toBe(50);
    });

    when('the client updates the cache configuration', () => {
      client.updateCacheConfig({
        maxEntries: 100,
        defaultTtl: 600000,
      });
    });

    then('the new settings shall take effect', () => {
      const updatedStats = client.getCacheStats();
      expect(updatedStats!.maxEntries).toBe(100);
    });
  });

  test('Repeat request inside the TTL window does not observe a server error', ({
    given,
    when,
    then,
  }) => {
    let errorResult: any;
    const validData = [99005338, 99005551];
    const etag = '"valid-etag"';

    given('a cached response exists', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(validData), {
        headers: { ETag: etag },
      });

      const firstResult = await client.alliance.getAlliances();
      expect(firstResult).toEqual(validData);
    });

    when('the server would return an error', async () => {
      fetchMock.mockResponseOnce('Server Error', { status: 500 });

      errorResult = await client.alliance.getAlliances();
    });

    then('the client shall return the originally cached data', () => {
      expect(errorResult).toEqual(validData);
    });
  });

  test('Response without an ETag header is not cached', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const data = [99005338, 99005551];

    given('a server response without ETag headers', () => {
      fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    when('the client makes requests without ETag', async () => {
      result = await client.alliance.getAlliances();
    });

    then('the client shall work normally without caching', () => {
      expect(result).toEqual(data);
      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });
  });

  test('Cache statistics are unavailable when caching is disabled', ({
    given,
    when,
    then,
  }) => {
    let clientWithoutCache: EsiClient;
    let result: any;
    const data = [99005338, 99005551];

    given('a client with ETag caching disabled', () => {
      clientWithoutCache = new EsiClient({
        enableETagCache: false,
      });

      fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: { ETag: '"should-not-be-cached"' },
      });
    });

    when('the client makes API requests without cache', async () => {
      result = await clientWithoutCache.alliance.getAlliances();
    });

    then('responses shall be returned normally without caching', () => {
      expect(result).toEqual(data);
      expect(clientWithoutCache.getCacheStats()).toBeNull();

      clientWithoutCache.shutdown();
    });
  });
  // ── Serving from cache when ESI fails ──────────────────────────────

  test('HTTP <status> on a revalidation is answered from the cache', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let response: EsiResponse<number[]>;

    given(
      'a client whose ETag cache holds the dogma attribute index',
      async () => {
        staleClient = createStaleOnErrorClient();
        await cacheDogmaAttributeIndex(staleClient);
      },
    );

    and(
      /^ESI answers the revalidation of the dogma attribute index with HTTP (\d+)$/,
      (status: string) => {
        queueErrorResponse(Number(status));
      },
    );

    when(
      'the client requests the dogma attribute index with metadata',
      async () => {
        response = await staleClient.dogma.withMetadata().getAttributes();
      },
    );

    then(
      'the client resolves with the cached attribute identifiers flagged as stale',
      () => {
        expect(response.data).toEqual(DOGMA_ATTRIBUTE_IDS);
        expect(response.meta.fromCache).toBe(true);
        expect(response.meta.stale).toBe(true);
        expect(response.meta.cacheHitType).toBe('stale-on-error');
      },
    );

    and(
      'the revalidation request carried the cached ETag in If-None-Match',
      () => {
        expect(requestHeader(1, 'If-None-Match')).toBe(DOGMA_ATTRIBUTES_ETAG);
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('HTTP 500 with nothing cached rejects after one request', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let error: unknown;

    given('a client with an empty ETag cache', () => {
      staleClient = createStaleOnErrorClient();
      expect(staleClient.getCacheStats()!.totalEntries).toBe(0);
    });

    and(
      /^ESI answers the dogma attribute index request with HTTP (\d+) (\d+) times$/,
      (status: string, times: string) => {
        queueErrorResponse(Number(status), Number(times));
      },
    );

    when('the client requests the dogma attribute index', async () => {
      error = await captureRejection(staleClient.dogma.getAttributes());
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(error, Number(status));
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('HTTP 503 on every attempt with nothing cached rejects once retries are spent', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let error: unknown;

    given('a client with an empty ETag cache', () => {
      staleClient = createStaleOnErrorClient();
      expect(staleClient.getCacheStats()!.totalEntries).toBe(0);
    });

    and(
      /^ESI answers the dogma attribute index request with HTTP (\d+) (\d+) times$/,
      (status: string, times: string) => {
        expect(Number(times)).toBe(FAST_RETRY.maxRetries + 1);
        queueErrorResponse(Number(status), Number(times));
      },
    );

    when('the client requests the dogma attribute index', async () => {
      error = await captureRejection(staleClient.dogma.getAttributes());
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(error, Number(status));
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('HTTP 404 on a revalidation rejects despite the cached entry', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let error: unknown;

    given(
      'a client whose ETag cache holds the dogma attribute index',
      async () => {
        staleClient = createStaleOnErrorClient();
        await cacheDogmaAttributeIndex(staleClient);
      },
    );

    and(
      /^ESI answers the revalidation of the dogma attribute index with HTTP (\d+)$/,
      (status: string) => {
        queueErrorResponse(Number(status));
      },
    );

    when('the client requests the dogma attribute index', async () => {
      error = await captureRejection(staleClient.dogma.getAttributes());
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(error, Number(status));
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });
});
