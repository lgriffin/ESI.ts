import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { ApiClient } from '../../../../src/core/ApiClient';
import { configureApiClient } from '../../../../src/core/configureApiClient';
import { MarketClient } from '../../../../src/clients/MarketClient';
import { EsiError } from '../../../../src/core/util/error';
import type { EsiResponse } from '../../../../src/types/api-responses';
import fetchMock from 'jest-fetch-mock';
import { makeJwt } from '../shared/sso-helpers';

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

/** GET status has a 30 second spec cache TTL. */
const SERVER_STATUS = {
  players: 23456,
  server_version: '2891234',
  start_time: '2026-09-16T11:05:00Z',
  vip: false,
};
const SERVER_STATUS_ETAG = '"server-status-v1"';
const SERVER_STATUS_TTL_MS = 30_000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Moves the clock the cache reads (Date.now) forward without waiting. Retry
 * backoff still runs on real timers, so nothing else needs faking.
 */
let clockOffsetMs = 0;
function advanceClock(ms: number): void {
  if (clockOffsetMs === 0) {
    const realNow = Date.now.bind(Date);
    jest.spyOn(Date, 'now').mockImplementation(() => realNow() + clockOffsetMs);
  }
  clockOffsetMs += ms;
}

function resetClock(): void {
  clockOffsetMs = 0;
  jest.restoreAllMocks();
}

async function cacheServerStatus(client: EsiClient): Promise<void> {
  fetchMock.mockResponseOnce(JSON.stringify(SERVER_STATUS), {
    headers: {
      ETag: SERVER_STATUS_ETAG,
      'Content-Type': 'application/json',
    },
  });
  await client.status.getStatus();
  expect(client.getCacheStats()!.totalEntries).toBe(1);
}

/** Cache the server status from a response carrying the given Expires header. */
async function cacheServerStatusExpiring(
  client: EsiClient,
  expires: string,
): Promise<void> {
  fetchMock.mockResponseOnce(JSON.stringify(SERVER_STATUS), {
    headers: {
      ETag: SERVER_STATUS_ETAG,
      Expires: expires,
      'Content-Type': 'application/json',
    },
  });
  await client.status.getStatus();
  expect(client.getCacheStats()!.totalEntries).toBe(1);
}

/** An HTTP date `ms` milliseconds from the cache's own clock. */
const httpDateFromNow = (ms: number): string =>
  new Date(Date.now() + ms).toUTCString();

const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// ---------------------------------------------------------------------------
// Stream fixtures: GET markets/{region_id}/types has a 600 second spec TTL and
// is paginated, so an ordinary call caches it and the stream helpers read it.
// ---------------------------------------------------------------------------

const THE_FORGE = 10000002;
const MARKET_TYPE_IDS = [34, 35, 36];

function queueMarketTypes(): void {
  fetchMock.mockResponseOnce(JSON.stringify(MARKET_TYPE_IDS), {
    headers: {
      ETag: '"market-types-v1"',
      'X-Pages': '1',
      'Content-Type': 'application/json',
    },
  });
}

type PageHelper = 'stream' | 'fetch-all';
const HELPER = /(stream|fetch-all)/.source;

/** Read every market type through a stream* or a fetchAll* helper. */
async function readMarketTypesThrough(
  client: EsiClient,
  helper: PageHelper,
): Promise<number[]> {
  return helper === 'stream'
    ? streamMarketTypes(client)
    : client.market.fetchAllMarketTypes(THE_FORGE);
}

/** Two pages of market types, each with its own ETag, announcing 2 pages. */
const MARKET_TYPE_PAGES = [[34, 35], [36]];

function queueMarketTypePages(): void {
  MARKET_TYPE_PAGES.forEach((page, i) => {
    fetchMock.mockResponseOnce(JSON.stringify(page), {
      headers: {
        ETag: `"market-types-page-${i + 1}"`,
        'X-Pages': String(MARKET_TYPE_PAGES.length),
        'Content-Type': 'application/json',
      },
    });
  });
}

/**
 * A market client over a bare ApiClient, whose cache a step can seed: no
 * call of the client stores an entry under a page's own URL.
 */
function createSeededMarketClient(): { market: MarketClient; api: ApiClient } {
  const api = new ApiClient('bdd-page-etag', 'https://esi.evetech.net');
  configureApiClient(api, {
    retryConfig: FAST_RETRY,
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
  return { market: new MarketClient(api), api };
}

function createStreamClient(): EsiClient {
  return new EsiClient({
    clientId: 'bdd-stream-etag',
    baseUrl: 'https://esi.evetech.net',
    retryConfig: FAST_RETRY,
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
}

async function streamMarketTypes(client: EsiClient): Promise<number[]> {
  const streamed: number[] = [];
  for await (const page of client.market.streamMarketTypes(THE_FORGE)) {
    streamed.push(...page.data);
  }
  return streamed;
}

/** A 304 has a null body; the Response constructor rejects even ''. */
function queueNotModified(etag: string): void {
  fetchMock.mockResponseOnce(
    new Response(null, { status: 304, headers: { ETag: etag } }),
  );
}

/** The resolved value, or the error the call rejected with. */
async function captureOutcome(call: () => Promise<unknown>): Promise<unknown> {
  try {
    return await call();
  } catch (error) {
    return error;
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

// ---------------------------------------------------------------------------
// Identity fixtures: GET markets/structures/{structure_id}/ has a 300 second
// spec TTL, requires auth, and its path names no character, so the same URL
// asked under two tokens is the same question with two possible answers.
// ---------------------------------------------------------------------------

const STRUCTURE_ID = 1_000_000_000_001;
const STRUCTURE_ORDERS = [
  {
    order_id: 6_000_000_001,
    type_id: 34,
    location_id: STRUCTURE_ID,
    volume_total: 1000,
    volume_remain: 800,
    min_volume: 1,
    price: 5.5,
    is_buy_order: false,
    duration: 90,
    issued: '2026-09-27T10:00:00Z',
    range: 'station',
  },
];
const STRUCTURE_ORDERS_ETAG = '"structure-orders-v1"';
const STRUCTURE_ORDERS_TTL_MS = 300_000;

function queueStructureOrders(): void {
  fetchMock.mockResponseOnce(JSON.stringify(STRUCTURE_ORDERS), {
    headers: {
      ETag: STRUCTURE_ORDERS_ETAG,
      'Content-Type': 'application/json',
    },
  });
}

function createIdentityClient(
  accessToken: string,
  onTokenRefresh?: () => Promise<string>,
): EsiClient {
  return new EsiClient({
    clientId: 'bdd-identity-cache',
    baseUrl: 'https://esi.evetech.net',
    accessToken,
    onTokenRefresh,
    enableETagCache: true,
    etagCacheConfig: { maxEntries: 50, defaultTtl: 300000 },
    retryConfig: FAST_RETRY,
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
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
    resetClock();
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
            vip: false,
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

  // ── Keeping entries past their freshness TTL ───────────────────────

  test('HTTP 503 after the server status TTL has elapsed is answered from the cache', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let response: EsiResponse<typeof SERVER_STATUS>;

    given('a client whose ETag cache holds the server status', async () => {
      staleClient = createStaleOnErrorClient();
      await cacheServerStatus(staleClient);
    });

    and('the 30 second spec cache TTL of the server status has elapsed', () => {
      advanceClock(SERVER_STATUS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the server status request with HTTP 503 on every attempt',
      () => {
        queueErrorResponse(503, FAST_RETRY.maxRetries + 1);
      },
    );

    when('the client requests the server status with metadata', async () => {
      response = await staleClient.status.withMetadata().getStatus();
    });

    then(
      'the client resolves with the cached server status flagged as stale',
      () => {
        expect(response.data).toEqual(SERVER_STATUS);
        expect(response.meta.fromCache).toBe(true);
        expect(response.meta.stale).toBe(true);
        expect(response.meta.cacheHitType).toBe('stale-on-error');
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('Revalidation after the server status TTL has elapsed is answered by a 304', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let response: EsiResponse<typeof SERVER_STATUS>;

    given('a client whose ETag cache holds the server status', async () => {
      staleClient = createStaleOnErrorClient();
      await cacheServerStatus(staleClient);
    });

    and('the 30 second spec cache TTL of the server status has elapsed', () => {
      advanceClock(SERVER_STATUS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the revalidation of the server status with HTTP 304',
      () => {
        queueNotModified(SERVER_STATUS_ETAG);
      },
    );

    when('the client requests the server status with metadata', async () => {
      response = await staleClient.status.withMetadata().getStatus();
    });

    then(
      'the client resolves with the cached server status from a 304 revalidation',
      () => {
        expect(response.data).toEqual(SERVER_STATUS);
        expect(response.meta.fromCache).toBe(true);
        expect(response.meta.stale).toBeFalsy();
        expect(response.meta.cacheHitType).toBe('etag-304');
      },
    );

    and(
      'the revalidation request carried the cached server status ETag in If-None-Match',
      () => {
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(requestHeader(1, 'If-None-Match')).toBe(SERVER_STATUS_ETAG);
        staleClient.shutdown();
      },
    );
  });

  test('HTTP 503 more than an hour after the server status TTL has elapsed rejects', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let error: unknown;

    given('a client whose ETag cache holds the server status', async () => {
      staleClient = createStaleOnErrorClient();
      await cacheServerStatus(staleClient);
    });

    and(
      'more than one hour past the spec cache TTL of the server status has elapsed',
      () => {
        advanceClock(SERVER_STATUS_TTL_MS + ONE_HOUR_MS + 1_000);
      },
    );

    and(
      'ESI answers the server status request with HTTP 503 on every attempt',
      () => {
        queueErrorResponse(503, FAST_RETRY.maxRetries + 1);
      },
    );

    when('the client requests the server status', async () => {
      error = await captureRejection(staleClient.status.getStatus());
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

  test('Server status revalidated by a 304 is served without a request 20 seconds later', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    const results: unknown[] = [];

    given('a client whose ETag cache holds the server status', async () => {
      staleClient = createStaleOnErrorClient();
      await cacheServerStatus(staleClient);
    });

    and('the 30 second spec cache TTL of the server status has elapsed', () => {
      advanceClock(SERVER_STATUS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the revalidation of the server status with HTTP 304',
      () => {
        queueNotModified(SERVER_STATUS_ETAG);
      },
    );

    when(
      'the client requests the server status twice, 20 seconds apart',
      async () => {
        results.push(
          await captureOutcome(() => staleClient.status.getStatus()),
        );
        advanceClock(20_000);
        results.push(
          await captureOutcome(() => staleClient.status.getStatus()),
        );
      },
    );

    then('both calls resolve with the cached server status', () => {
      expect(results).toEqual([SERVER_STATUS, SERVER_STATUS]);
    });

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('A repeat character assets call inside the TTL returns both pages', ({
    given,
    and,
    when,
    then,
  }) => {
    const characterId = 90000001;
    const asset = (itemId: number) => ({
      item_id: itemId,
      type_id: 34,
      quantity: 1,
      location_id: 60003760,
      location_type: 'station',
      location_flag: 'Hangar',
      is_singleton: false,
    });
    const pages = [[asset(1000000001), asset(1000000002)], [asset(1000000003)]];
    let assetsClient: EsiClient;
    const results: unknown[] = [];

    given('a client with an access token and an empty cache', () => {
      assetsClient = new EsiClient({
        clientId: 'bdd-paginated-cache',
        baseUrl: 'https://esi.evetech.net',
        accessToken: 'bdd-access-token',
        retryConfig: FAST_RETRY,
        rateLimiterConfig: { minDelayMs: 0 },
        logLevel: 'error',
      });
    });

    and(
      /^ESI answers the character assets request with (\d+) pages$/,
      (count: string) => {
        for (let page = 1; page <= Number(count); page++) {
          fetchMock.mockResponseOnce(JSON.stringify(pages[page - 1]), {
            headers: {
              ETag: `"assets-page-${page}"`,
              'X-Pages': count,
              'Content-Type': 'application/json',
            },
          });
        }
      },
    );

    when('the client requests the character assets twice', async () => {
      results.push(await assetsClient.assets.getCharacterAssets(characterId));
      results.push(await assetsClient.assets.getCharacterAssets(characterId));
    });

    then('both calls resolve with the assets from both pages', () => {
      expect(results).toEqual([pages.flat(), pages.flat()]);
    });

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      assetsClient.shutdown();
    });
  });

  // ── Identity ──────────────────────────────────────────────────────

  test('Structure orders revalidated by a 304 after the access token is replaced', ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;
    let response: EsiResponse<unknown>;

    given(
      /^a client holding an SSO access token for character (\d+)$/,
      (characterId: string) => {
        identityClient = createIdentityClient(
          makeJwt({ characterId: Number(characterId) }),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
      expect(identityClient.getCacheStats()!.totalEntries).toBe(1);
    });

    when(
      /^the access token is replaced by a new SSO token for character (\d+)$/,
      (characterId: string) => {
        identityClient.setAccessToken(
          makeJwt({ characterId: Number(characterId), ownerHash: 'rotated' }),
        );
      },
    );

    and('the structure orders TTL has elapsed', () => {
      advanceClock(STRUCTURE_ORDERS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the revalidation of the structure orders with HTTP 304',
      () => {
        queueNotModified(STRUCTURE_ORDERS_ETAG);
      },
    );

    and('the client requests the structure orders again', async () => {
      response = await identityClient.market
        .withMetadata()
        .getMarketOrdersInStructure(STRUCTURE_ID);
    });

    then(
      'the client resolves with the cached structure orders from a 304 revalidation',
      () => {
        expect(response.data).toEqual(STRUCTURE_ORDERS);
        expect(response.meta.cacheHitType).toBe('etag-304');
      },
    );

    and(
      'the revalidation request carried the cached structure orders ETag in If-None-Match',
      () => {
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(requestHeader(1, 'If-None-Match')).toBe(STRUCTURE_ORDERS_ETAG);
        identityClient.shutdown();
      },
    );
  });

  test("Token refresh after a 401 keeps the character's cached entry", ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;
    let response: EsiResponse<unknown>;

    given(
      /^a client whose refresh provider issues a new SSO token for character (\d+)$/,
      (characterId: string) => {
        const id = Number(characterId);
        identityClient = createIdentityClient(
          makeJwt({ characterId: id }),
          () =>
            Promise.resolve(makeJwt({ characterId: id, ownerHash: 'rotated' })),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
      expect(identityClient.getCacheStats()!.totalEntries).toBe(1);
    });

    when('the structure orders TTL has elapsed', () => {
      advanceClock(STRUCTURE_ORDERS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the next structure orders request with HTTP 401 and the retry with HTTP 304',
      () => {
        queueErrorResponse(401);
        queueNotModified(STRUCTURE_ORDERS_ETAG);
      },
    );

    and('the client requests the structure orders again', async () => {
      response = await identityClient.market
        .withMetadata()
        .getMarketOrdersInStructure(STRUCTURE_ID);
    });

    then(
      'the client resolves with the cached structure orders from a 304 revalidation',
      () => {
        expect(response.data).toEqual(STRUCTURE_ORDERS);
        expect(response.meta.cacheHitType).toBe('etag-304');
      },
    );

    and(
      /^the client sent (\d+) requests, the last carrying the cached structure orders ETag in If-None-Match$/,
      (count: string) => {
        expect(fetchMock.mock.calls).toHaveLength(Number(count));
        expect(requestHeader(Number(count) - 1, 'If-None-Match')).toBe(
          STRUCTURE_ORDERS_ETAG,
        );
        identityClient.shutdown();
      },
    );
  });

  test("A second character's structure orders are fetched rather than served from the first character's entry", ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;

    given(
      /^a client holding an SSO access token for character (\d+)$/,
      (characterId: string) => {
        identityClient = createIdentityClient(
          makeJwt({ characterId: Number(characterId) }),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
    });

    when(
      /^the access token is replaced by an SSO token for character (\d+)$/,
      (characterId: string) => {
        identityClient.setAccessToken(
          makeJwt({ characterId: Number(characterId) }),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client requests the structure orders again', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
    });

    then(
      'the second structure orders request carried no If-None-Match header',
      () => {
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(requestHeader(1, 'If-None-Match')).toBeUndefined();
      },
    );

    and(/^the cache holds (\d+) entries$/, (count: string) => {
      expect(identityClient.getCacheStats()!.totalEntries).toBe(Number(count));
      identityClient.shutdown();
    });
  });

  test('An opaque token replaced by another opaque token fetches the structure orders afresh', ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;

    given('a client holding an opaque access token', () => {
      identityClient = createIdentityClient('opaque-token-one');
    });

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
    });

    when('the access token is replaced by a different opaque token', () => {
      identityClient.setAccessToken('opaque-token-two');
    });

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client requests the structure orders again', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
    });

    then(
      'the second structure orders request carried no If-None-Match header',
      () => {
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(requestHeader(1, 'If-None-Match')).toBeUndefined();
      },
    );

    and(/^the cache holds (\d+) entries$/, (count: string) => {
      expect(identityClient.getCacheStats()!.totalEntries).toBe(Number(count));
      identityClient.shutdown();
    });
  });

  test("A replaced token that ESI rejects is served nothing from the character's entry", ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;
    let outcome: unknown;

    given(
      /^a client holding an SSO access token for character (\d+)$/,
      (characterId: string) => {
        identityClient = createIdentityClient(
          makeJwt({ characterId: Number(characterId) }),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
      expect(identityClient.getCacheStats()!.totalEntries).toBe(1);
    });

    when(
      /^the access token is replaced by a new SSO token for character (\d+)$/,
      (characterId: string) => {
        identityClient.setAccessToken(
          makeJwt({ characterId: Number(characterId), ownerHash: 'forged' }),
        );
      },
    );

    and('ESI answers the next structure orders request with HTTP 401', () => {
      queueErrorResponse(401);
    });

    and('the client requests the structure orders again', async () => {
      outcome = await captureOutcome(() =>
        identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID),
      );
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(outcome, Number(status));
      },
    );

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      identityClient.shutdown();
    });
  });

  test('A replaced token is served from the spec TTL only after ESI has answered it', ({
    given,
    and,
    when,
    then,
  }) => {
    let identityClient: EsiClient;

    given(
      /^a client holding an SSO access token for character (\d+)$/,
      (characterId: string) => {
        identityClient = createIdentityClient(
          makeJwt({ characterId: Number(characterId) }),
        );
      },
    );

    and('ESI answers the structure orders request with an ETag', () => {
      queueStructureOrders();
    });

    and('the client has requested the structure orders', async () => {
      await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
    });

    when(
      /^the access token is replaced by a new SSO token for character (\d+)$/,
      (characterId: string) => {
        identityClient.setAccessToken(
          makeJwt({ characterId: Number(characterId), ownerHash: 'rotated' }),
        );
      },
    );

    and(
      'ESI answers the revalidation of the structure orders with HTTP 304',
      () => {
        queueNotModified(STRUCTURE_ORDERS_ETAG);
      },
    );

    and('the client requests the structure orders twice more', async () => {
      const first =
        await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
      const second =
        await identityClient.market.getMarketOrdersInStructure(STRUCTURE_ID);
      expect(first).toEqual(STRUCTURE_ORDERS);
      expect(second).toEqual(STRUCTURE_ORDERS);
    });

    then(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      expect(requestHeader(1, 'If-None-Match')).toBe(STRUCTURE_ORDERS_ETAG);
      identityClient.shutdown();
    });
  });
  // ── Exclusions: Expires, stale-on-error retries, the stream path ──────

  test('A server status whose Expires has passed is still served inside its spec TTL', ({
    given,
    when,
    then,
    and,
  }) => {
    let staleClient: EsiClient;
    let result: unknown;

    given(
      'a client whose ETag cache holds the server status from a response whose Expires header had already passed',
      async () => {
        staleClient = createStaleOnErrorClient();
        await cacheServerStatusExpiring(
          staleClient,
          httpDateFromNow(-ONE_HOUR_MS),
        );
      },
    );

    when('the client requests the server status 10 seconds later', async () => {
      advanceClock(10_000);
      result = await staleClient.status.getStatus();
    });

    then('the client resolves with the cached server status', () => {
      expect(result).toEqual(SERVER_STATUS);
    });

    and(/^the client sent (\d+) request$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('A server status whose Expires lies a day ahead is revalidated after its spec TTL', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let result: unknown;

    given(
      'a client whose ETag cache holds the server status from a response whose Expires header lies a day ahead',
      async () => {
        staleClient = createStaleOnErrorClient();
        await cacheServerStatusExpiring(
          staleClient,
          httpDateFromNow(ONE_DAY_MS),
        );
      },
    );

    and('the 30 second spec cache TTL of the server status has elapsed', () => {
      advanceClock(SERVER_STATUS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the revalidation of the server status with HTTP 304',
      () => {
        queueNotModified(SERVER_STATUS_ETAG);
      },
    );

    when('the client requests the server status', async () => {
      result = await staleClient.status.getStatus();
    });

    then('the client resolves with the cached server status', () => {
      expect(result).toEqual(SERVER_STATUS);
    });

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      expect(requestHeader(1, 'If-None-Match')).toBe(SERVER_STATUS_ETAG);
      staleClient.shutdown();
    });
  });

  test('A 503 on the server status revalidation is not sent again', ({
    given,
    and,
    when,
    then,
  }) => {
    let staleClient: EsiClient;
    let result: unknown;

    given('a client whose ETag cache holds the server status', async () => {
      staleClient = createStaleOnErrorClient();
      await cacheServerStatus(staleClient);
    });

    and('the 30 second spec cache TTL of the server status has elapsed', () => {
      advanceClock(SERVER_STATUS_TTL_MS + 1_000);
    });

    and(
      'ESI answers the server status request with HTTP 503 on every attempt',
      () => {
        queueErrorResponse(503, FAST_RETRY.maxRetries + 1);
      },
    );

    when('the client requests the server status', async () => {
      result = await staleClient.status.getStatus();
    });

    then('the client resolves with the cached server status', () => {
      expect(result).toEqual(SERVER_STATUS);
    });

    and(/^the client sent (\d+) requests$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(Number(count));
      staleClient.shutdown();
    });
  });

  test('Page 2 of the market types is asked unconditionally despite an entry for its URL', ({
    given,
    and,
    when,
    then,
  }) => {
    let seeded: { market: MarketClient; api: ApiClient };
    let result: unknown;

    given(
      'a client whose ETag cache holds an entry for page 2 of the market types',
      () => {
        seeded = createSeededMarketClient();
        seeded.api
          .getCache()!
          .set(
            `${seeded.api.getLink()}/markets/${THE_FORGE}/types/?page=2`,
            '"seeded-page-2"',
            [99],
            {},
            ONE_HOUR_MS,
          );
      },
    );

    and('ESI answers the market types with 2 pages', () => {
      queueMarketTypePages();
    });

    when('the client requests the market types for The Forge', async () => {
      result = await seeded.market.getMarketTypes(THE_FORGE);
    });

    then('the client resolves with the market types of both pages', () => {
      expect(result).toEqual(MARKET_TYPE_PAGES.flat());
    });

    and('the page 2 request carried no If-None-Match header', () => {
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(String(fetchMock.mock.calls[1]![0])).toBe(
        `${seeded.api.getLink()}/markets/${THE_FORGE}/types/?page=2`,
      );
      expect(requestHeader(1, 'If-None-Match')).toBeUndefined();
      (seeded.api.getCache() as { shutdown(): void }).shutdown();
    });
  });

  test('A two-page market types call leaves one cache entry', ({
    given,
    and,
    when,
    then,
  }) => {
    let pageClient: EsiClient;
    let result: unknown;

    given('a client with an empty cache', () => {
      pageClient = createStreamClient();
    });

    and('ESI answers the market types with 2 pages', () => {
      queueMarketTypePages();
    });

    when('the client requests the market types for The Forge', async () => {
      result = await pageClient.market.getMarketTypes(THE_FORGE);
    });

    then('the client resolves with the market types of both pages', () => {
      expect(result).toEqual(MARKET_TYPE_PAGES.flat());
    });

    and(/^the ETag cache holds (\d+) entry$/, (count: string) => {
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(pageClient.getCacheStats()!.totalEntries).toBe(Number(count));
      pageClient.shutdown();
    });
  });
  // ── The stream* and fetchAll* helpers ───────────────────────────────

  test('Reading market types through the <helper> helper after an ordinary market types call', ({
    given,
    and,
    when,
    then,
  }) => {
    let helperClient: EsiClient;
    let read: number[] = [];

    given('a client with an empty cache', () => {
      helperClient = createStreamClient();
    });

    and('the client has fetched the market types for The Forge', async () => {
      queueMarketTypes();
      await helperClient.market.getMarketTypes(THE_FORGE);
      expect(requestHeader(0, 'If-None-Match')).toBeUndefined();
      expect(helperClient.getCacheStats()!.totalEntries).toBe(1);
    });

    when(
      new RegExp(
        `^the client reads the market types for The Forge through the ${HELPER} helper$`,
      ),
      async (helper: PageHelper) => {
        queueMarketTypes();
        read = await readMarketTypesThrough(helperClient, helper);
      },
    );

    then('the helper yields every market type', () => {
      expect(read).toEqual(MARKET_TYPE_IDS);
    });

    and("the helper's request carried no If-None-Match header", () => {
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(requestHeader(1, 'If-None-Match')).toBeUndefined();
      helperClient.shutdown();
    });
  });

  test('Reading market types through the <helper> helper inside their 600 second spec TTL sends a request', ({
    given,
    and,
    when,
    then,
  }) => {
    let helperClient: EsiClient;
    let read: number[] = [];

    given('a client with an empty cache', () => {
      helperClient = createStreamClient();
    });

    and('the client has fetched the market types for The Forge', async () => {
      queueMarketTypes();
      await helperClient.market.getMarketTypes(THE_FORGE);
      expect(helperClient.getCacheStats()!.totalEntries).toBe(1);
    });

    when(
      new RegExp(
        `^the client reads the market types for The Forge through the ${HELPER} helper$`,
      ),
      async (helper: PageHelper) => {
        queueMarketTypes();
        read = await readMarketTypesThrough(helperClient, helper);
      },
    );

    then('the helper yields every market type', () => {
      expect(read).toEqual(MARKET_TYPE_IDS);
    });

    and("the client sent a request for the helper's page", () => {
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(String(fetchMock.mock.calls[1]![0])).toContain(
        `markets/${THE_FORGE}/types`,
      );
      helperClient.shutdown();
    });
  });

  test('An ordinary market types call after reading them through the <helper> helper fetches afresh', ({
    given,
    and,
    when,
    then,
  }) => {
    let helperClient: EsiClient;
    let result: unknown;

    given('a client with an empty cache', () => {
      helperClient = createStreamClient();
    });

    and(
      new RegExp(
        `^the client has read the market types for The Forge through the ${HELPER} helper$`,
      ),
      async (helper: PageHelper) => {
        queueMarketTypes();
        expect(await readMarketTypesThrough(helperClient, helper)).toEqual(
          MARKET_TYPE_IDS,
        );
        expect(helperClient.getCacheStats()!.totalEntries).toBe(0);
      },
    );

    when('the client requests the market types for The Forge', async () => {
      queueMarketTypes();
      result = await helperClient.market.getMarketTypes(THE_FORGE);
    });

    then('the client resolves with every market type', () => {
      expect(result).toEqual(MARKET_TYPE_IDS);
    });

    and('the ordinary request carried no If-None-Match header', () => {
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(requestHeader(1, 'If-None-Match')).toBeUndefined();
      helperClient.shutdown();
    });
  });

  test('Market types read through the <helper> helper and answered with HTTP 500 reject despite the cached entry', ({
    given,
    and,
    when,
    then,
  }) => {
    let helperClient: EsiClient;
    let error: unknown;

    given('a client with an empty cache', () => {
      helperClient = createStreamClient();
    });

    and('the client has fetched the market types for The Forge', async () => {
      queueMarketTypes();
      await helperClient.market.getMarketTypes(THE_FORGE);
      expect(helperClient.getCacheStats()!.totalEntries).toBe(1);
    });

    and("ESI answers the helper's market types page with HTTP 500", () => {
      queueErrorResponse(500);
    });

    when(
      new RegExp(
        `^the client reads the market types for The Forge through the ${HELPER} helper expecting a failure$`,
      ),
      async (helper: PageHelper) => {
        error = await captureRejection(
          readMarketTypesThrough(helperClient, helper),
        );
      },
    );

    then(
      /^the helper rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(error, Number(status));
        expect(fetchMock.mock.calls).toHaveLength(2);
        helperClient.shutdown();
      },
    );
  });
});
