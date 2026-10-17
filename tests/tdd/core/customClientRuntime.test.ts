/**
 * The runtime features `createEsi` gained (response metadata and safe mode,
 * diagnostics, supplied middleware) reach the custom clients through the
 * shared `configureApiClient` path: decision D in guides/CLIENT-ARCHITECTURE.md.
 */
import fetchMock from 'jest-fetch-mock';
import { EsiClient } from '../../../src/EsiClient';
import {
  EsiApiFactory,
  EsiClientBuilder,
  type ApiClientType,
} from '../../../src/EsiClientBuilder';
import type { StatusClient } from '../../../src/clients/StatusClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { configureApiClient } from '../../../src/core/configureApiClient';
import { CacheStoreCache } from '../../../src/core/cache/CacheStoreCache';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import type {
  CachedResponse,
  CacheStore,
} from '../../../src/core/ports/CacheStore';
import type { Clock } from '../../../src/core/ports/Clock';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { EsiError } from '../../../src/core/util/error';

fetchMock.enableMocks();

const STATUS = {
  players: 23_456,
  server_version: '2987654',
  start_time: '2026-09-27T11:00:00Z',
  vip: false,
};

const SEAM = {
  baseUrl: 'https://esi.evetech.net',
  logLevel: 'silent',
  retryConfig: { maxRetries: 0 },
  rateLimiterConfig: { minDelayMs: 0 },
} as const;

const REGISTERED: ApiClientType[] = [
  'alliance',
  'assets',
  'calendar',
  'characters',
  'clones',
  'contacts',
  'contracts',
  'corporations',
  'corporationProjects',
  'dogma',
  'factions',
  'fittings',
  'fleets',
  'incursions',
  'industry',
  'insurance',
  'killmails',
  'location',
  'loyalty',
  'mail',
  'market',
  'pi',
  'route',
  'search',
  'skills',
  'sovereignty',
  'status',
  'ui',
  'universe',
  'wallet',
  'wars',
  'meta',
  'freelanceJobs',
  'skyhooks',
  'cosmetics',
  'paragonHub',
  'mercenary',
  'militaryCampaigns',
  'accessLists',
];

class MapStore implements CacheStore {
  readonly entries = new Map<string, CachedResponse>();
  shutdowns = 0;
  get(key: string): CachedResponse | null {
    return this.entries.get(key) ?? null;
  }
  set(
    key: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
  ): void {
    this.entries.set(key, { etag, data, headers, timestamp: Date.now() });
  }
  delete(key: string): boolean {
    return this.entries.delete(key);
  }
  clear(): void {
    this.entries.clear();
  }
  shutdown(): void {
    this.shutdowns += 1;
  }
}

function statusAnswer(headers: Record<string, string> = {}): void {
  fetchMock.mockResponseOnce(JSON.stringify(STATUS), {
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/** The ApiClient a domain client runs on (protected `_client`). */
function apiClientOf(domainClient: unknown): ApiClient {
  return (domainClient as { _client: ApiClient })._client;
}

describe('ARCH-08: supplied middleware through EsiClientConfig', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('configureApiClient installs every supplied instance from the config', () => {
    const store = new MapStore();
    const rateLimiter = new RateLimiter({ minDelayMs: 0 });
    const circuitBreaker = new CircuitBreaker();
    const deduplicator = new RequestDeduplicator();
    const clock: Clock = { now: () => 0, sleep: () => Promise.resolve() };
    const client = new ApiClient('t', 'https://esi.evetech.net');

    const result = configureApiClient(client, {
      cache: store,
      rateLimiter,
      circuitBreaker,
      deduplicator,
      clock,
    });

    expect(client.getCache()).toBeInstanceOf(CacheStoreCache);
    expect(client.getRateLimiter()).toBe(rateLimiter);
    expect(client.getCircuitBreaker()).toBe(circuitBreaker);
    expect(client.getDeduplicator()).toBe(deduplicator);
    expect(client.getClock()).toBe(clock);
    expect(result.deduplicator).toBeNull();
    circuitBreaker.shutdown();
  });

  it('uses a supplied ICache as it is, and drops it when the ETag cache is off', () => {
    const cache = new ETagCacheManager();
    const on = new ApiClient('t', 'https://esi.evetech.net');
    const off = new ApiClient('t', 'https://esi.evetech.net');

    configureApiClient(on, { cache });
    configureApiClient(off, { cache, enableETagCache: false });

    expect(on.getCache()).toBe(cache);
    expect(off.getCache()).toBeNull();
    cache.shutdown();
  });

  it('EsiClient keeps answers in a supplied cache store', async () => {
    const store = new MapStore();
    const client = new EsiClient({ ...SEAM, cache: store });
    statusAnswer({ etag: '"s1"' });

    await client.status.getStatus();
    await client.status.getStatus();

    expect([...store.entries.values()]).toEqual([
      expect.objectContaining({ etag: '"s1"', data: STATUS }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    client.shutdown();
  });

  it('a CustomEsiClient from the builder clears each request with a supplied rate limiter', async () => {
    const rateLimiter = new RateLimiter({ minDelayMs: 0 });
    const check = jest.spyOn(rateLimiter, 'checkRateLimit');
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig({ ...SEAM, rateLimiter })
      .build();
    statusAnswer();

    await custom.status!.getStatus();

    expect(check).toHaveBeenCalledTimes(1);
    custom.shutdown();
  });

  it('EsiApiFactory.createClient records failures in a supplied circuit breaker', async () => {
    const circuitBreaker = new CircuitBreaker({ failureThreshold: 1 });
    const status = EsiApiFactory.createClient('status', {
      ...SEAM,
      circuitBreaker,
    }) as StatusClient;
    fetchMock.mockResponseOnce('boom', { status: 500 });

    await expect(status.getStatus()).rejects.toBeInstanceOf(EsiError);

    expect(circuitBreaker.getStats().openCircuits).toBe(1);
    expect(apiClientOf(status).getCircuitBreaker()).toBe(circuitBreaker);
    circuitBreaker.shutdown();
  });

  it('EsiClient coalesces through a supplied deduplicator, even with deduplication off', async () => {
    const deduplicator = new RequestDeduplicator();
    const dedupe = jest.spyOn(deduplicator, 'dedupe');
    const client = new EsiClient({
      ...SEAM,
      enableETagCache: false,
      enableRequestDeduplication: false,
      deduplicator,
    });
    fetchMock.mockResponseOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                body: JSON.stringify(STATUS),
                headers: { 'content-type': 'application/json' },
              }),
            10,
          ),
        ),
    );

    await Promise.all([client.status.getStatus(), client.status.getStatus()]);

    expect(dedupe).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.diagnostics.getDeduplicatorStats()).toEqual({
      pendingRequests: 0,
    });
    client.shutdown();
  });

  it('EsiClient waits out the retry back-off on a supplied clock', async () => {
    const waits: number[] = [];
    const clock: Clock = {
      now: () => Date.now(),
      sleep: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
    };
    const client = new EsiClient({
      ...SEAM,
      retryConfig: { maxRetries: 1, baseDelayMs: 5000, maxDelayMs: 5000 },
      clock,
    });
    fetchMock.mockResponseOnce('down', { status: 503 });
    statusAnswer();

    await expect(client.status.getStatus()).resolves.toEqual(STATUS);

    expect(waits.length).toBeGreaterThanOrEqual(1);
    client.shutdown();
  });

  it.each([
    ['EsiClient', (config: object) => new EsiClient({ ...SEAM, ...config })],
    [
      'CustomEsiClient',
      (config: object) =>
        new EsiClientBuilder()
          .addClient('status')
          .withConfig({ ...SEAM, ...config })
          .build(),
    ],
  ])(
    '%s.shutdown() leaves a supplied cache store, circuit breaker and deduplicator to their owner',
    (_name, build) => {
      const store = new MapStore();
      const circuitBreaker = new CircuitBreaker();
      const cbShutdown = jest.spyOn(circuitBreaker, 'shutdown');
      const deduplicator = new RequestDeduplicator();
      const clear = jest.spyOn(deduplicator, 'clear');
      const client = build({ cache: store, circuitBreaker, deduplicator });

      client.shutdown();
      client.shutdown();

      expect(store.shutdowns).toBe(0);
      expect(cbShutdown).not.toHaveBeenCalled();
      expect(clear).not.toHaveBeenCalled();
      cbShutdown.mockRestore();
      circuitBreaker.shutdown();
    },
  );

  it('CustomEsiClient.shutdown() still stops the middleware it built', () => {
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig({ ...SEAM, enableCircuitBreaker: true })
      .build();
    const api = apiClientOf(custom.status);
    const cacheShutdown = jest.spyOn(api.getCache()!, 'shutdown');
    const cbShutdown = jest.spyOn(api.getCircuitBreaker()!, 'shutdown');

    custom.shutdown();

    expect(cacheShutdown).toHaveBeenCalledTimes(1);
    expect(cbShutdown).toHaveBeenCalledTimes(1);
  });
});

describe('ARCH-08: middleware shared between differently configured clients', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('a shared cache store does not serve one language to a client asking in another', async () => {
    const store = new MapStore();
    const english = new EsiClient({ ...SEAM, cache: store, language: 'en' });
    const german = new EsiClient({ ...SEAM, cache: store, language: 'de' });
    statusAnswer({ etag: '"en"' });
    statusAnswer({ etag: '"de"' });

    await english.status.getStatus();
    await german.status.getStatus();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(store.entries.size).toBe(2);
    english.shutdown();
    german.shutdown();
  });

  it('a shared cache store keeps tenants and compatibility dates apart', async () => {
    const store = new MapStore();
    const tq = new EsiClient({ ...SEAM, cache: store });
    const sisi = new EsiClient({
      ...SEAM,
      cache: store,
      tenant: 'singularity',
    });
    const dated = new EsiClient({
      ...SEAM,
      cache: store,
      compatibilityDate: '2020-01-01',
    });
    statusAnswer({ etag: '"a"' });
    statusAnswer({ etag: '"b"' });
    statusAnswer({ etag: '"c"' });

    await tq.status.getStatus();
    await sisi.status.getStatus();
    await dated.status.getStatus();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    tq.shutdown();
    sisi.shutdown();
    dated.shutdown();
  });

  it('a shared deduplicator does not join concurrent requests to different hosts', async () => {
    const deduplicator = new RequestDeduplicator();
    const config = {
      ...SEAM,
      enableETagCache: false,
      unsafeAllowCustomHost: true,
      deduplicator,
    };
    const tranquility = new EsiClient(config);
    const mirror = new EsiClient({
      ...config,
      baseUrl: 'https://esi.mirror.example',
    });
    fetchMock.mockResponse(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                body: JSON.stringify(STATUS),
                headers: { 'content-type': 'application/json' },
              }),
            10,
          ),
        ),
    );

    await Promise.all([
      tranquility.status.getStatus(),
      mirror.status.getStatus(),
    ]);

    const hosts = fetchMock.mock.calls.map(
      ([input]) => new URL(String(input)).host,
    );
    expect([...hosts].sort()).toEqual([
      'esi.evetech.net',
      'esi.mirror.example',
    ]);
    tranquility.shutdown();
    mirror.shutdown();
  });

  it('a store entry stamped ahead of the supplied clock is revalidated, not served', async () => {
    const store = new MapStore();
    const wall = new EsiClient({ ...SEAM, cache: store });
    const clock: Clock = { now: () => 0, sleep: () => Promise.resolve() };
    const behind = new EsiClient({ ...SEAM, cache: store, clock });
    statusAnswer({ etag: '"s1"' });
    statusAnswer({ etag: '"s2"' });

    await wall.status.getStatus();
    await behind.status.getStatus();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    wall.shutdown();
    behind.shutdown();
  });
});

describe('ARCH-08: CustomEsiClient diagnostics', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('counts the entries and hits of the cache its clients share', async () => {
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig(SEAM)
      .build();
    statusAnswer({ etag: '"s1"' });

    await custom.status!.getStatus();
    await custom.status!.getStatus();

    expect(custom.getCacheStats()).toMatchObject({ totalEntries: 1, hits: 1 });
    expect(custom.diagnostics.getCacheStats()).toEqual(custom.getCacheStats());
    expect(custom.diagnostics).toBe(custom.diagnostics);
    custom.shutdown();
  });

  it('clears the cache and changes its limits in place', async () => {
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig(SEAM)
      .build();
    statusAnswer({ etag: '"s1"' });
    statusAnswer({ etag: '"s1"' });

    await custom.status!.getStatus();
    custom.clearCache();
    await custom.status!.getStatus();
    custom.updateCacheConfig({ maxEntries: 7 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(custom.getCacheStats()?.maxEntries).toBe(7);
    custom.shutdown();
  });

  it('reports null cache and breaker statistics while those stages are off', () => {
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig({ ...SEAM, enableETagCache: false })
      .build();

    expect(custom.getCacheStats()).toBeNull();
    expect(custom.getCircuitBreakerStats()).toBeNull();
    expect(() => custom.resetCircuitBreaker()).not.toThrow();
    custom.shutdown();
  });

  it('reports and resets the circuits of its circuit breaker', async () => {
    const custom = new EsiClientBuilder()
      .addClient('status')
      .withConfig({
        ...SEAM,
        enableCircuitBreaker: true,
        circuitBreakerConfig: { failureThreshold: 1 },
      })
      .build();
    fetchMock.mockResponseOnce('boom', { status: 500 });
    await expect(custom.status!.getStatus()).rejects.toBeInstanceOf(EsiError);

    expect(custom.getCircuitBreakerStats()?.openCircuits).toBe(1);
    custom.resetCircuitBreaker();
    expect(custom.getCircuitBreakerStats()?.openCircuits).toBe(0);
    custom.shutdown();
  });
});

describe('ARCH-08: metadata and safe-mode views on the custom clients', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('EsiClient.withMetadata() resolves a domain call with its body and metadata', async () => {
    const client = new EsiClient(SEAM);
    statusAnswer({ etag: '"s1"', 'x-pages': '1' });

    const answer = await client.withMetadata().status.getStatus();

    expect(answer.data).toEqual(STATUS);
    expect(answer.meta).toMatchObject({
      etag: '"s1"',
      pages: 1,
      fromCache: false,
    });
    client.shutdown();
  });

  it('EsiClient.withSafeMode() resolves a failed domain call with its error', async () => {
    const client = new EsiClient(SEAM);
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'not found' }), {
      status: 404,
    });

    const result = await client.withSafeMode().status.getStatus();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EsiError);
    expect(result.error.statusCode).toBe(404);
    client.shutdown();
  });

  it('hands out one frozen view per mode, whose domains are the domain clients own views', () => {
    const client = new EsiClient(SEAM);
    const meta = client.withMetadata();
    const safe = client.withSafeMode();

    expect(client.withMetadata()).toBe(meta);
    expect(client.withSafeMode()).toBe(safe);
    expect(Object.isFrozen(meta)).toBe(true);
    expect(Object.isFrozen(safe)).toBe(true);
    expect(meta.market).toBe(client.market.withMetadata());
    expect(safe.market).toBe(client.market.withSafeMode());
    client.shutdown();
  });

  it('EsiClient views reach every registered domain client', () => {
    const client = new EsiClient(SEAM);
    const meta = client.withMetadata() as unknown as Record<string, unknown>;
    const safe = client.withSafeMode() as unknown as Record<string, unknown>;

    expect(Object.keys(meta).sort()).toEqual([...REGISTERED].sort());
    for (const name of REGISTERED) {
      const domain = (client as unknown as Record<string, any>)[name];
      expect(meta[name]).toBe(domain.withMetadata());
      expect(safe[name]).toBe(domain.withSafeMode());
    }
    client.shutdown();
  });

  it('CustomEsiClient views hold the enabled domains and undefined for the rest', async () => {
    const custom = new EsiClientBuilder()
      .addClients(['status', 'market'])
      .withConfig(SEAM)
      .build();
    statusAnswer({ etag: '"s2"' });

    const answer = await custom.withMetadata().status!.getStatus();

    expect(answer.meta.etag).toBe('"s2"');
    expect(custom.withMetadata()).toBe(custom.withMetadata());
    expect(custom.withSafeMode().market).toBe(custom.market!.withSafeMode());
    expect(custom.withMetadata().route).toBeUndefined();
    expect(custom.withSafeMode().route).toBeUndefined();
    custom.shutdown();
  });
});
