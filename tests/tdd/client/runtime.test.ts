/**
 * What createEsi builds, beyond what 0056-shared-runtime.feature specifies at
 * the transport seam: the shape of the runtime, how views share it, and the
 * options that reach the pipeline.
 */
import fetchMock from 'jest-fetch-mock';
import {
  createEsi,
  identityFromProvider,
  identityFromToken,
  type CachedResponse,
  type CacheStore,
  type Identity,
} from '../../../src/client';
import { ApiClient } from '../../../src/core/ApiClient';
import { COMPATIBILITY_DATE } from '../../../src/core/constants';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { EsiValidationError } from '../../../src/errors';
import { asset, STATUS, without } from '../helpers/generatedBodies';

fetchMock.enableMocks();

const OPTIONS = {
  userAgent: 'runtime-test/1.0 (dev@example.com)',
  logLevel: 'error' as const,
  rateLimiterConfig: { minDelayMs: 0 },
  retryConfig: { maxRetries: 0 },
};

const sent = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i]!;
  return { url: new URL(String(url)), headers: new Headers(init?.headers) };
};

describe('createEsi', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('refuses a user agent that is not a string', () => {
    expect(() => createEsi({ userAgent: 42 as unknown as string })).toThrow(
      /^\[VALIDATION_ERROR\] userAgent/,
    );
  });

  it('refuses a host other than ESI without unsafeAllowCustomHost', () => {
    expect(() =>
      createEsi({ ...OPTIONS, baseUrl: 'https://example.com' }),
    ).toThrow();
    expect(() =>
      createEsi({
        ...OPTIONS,
        baseUrl: 'https://example.com',
        unsafeAllowCustomHost: true,
      }),
    ).not.toThrow();
  });

  it('is frozen: nothing can replace the public view or as()', () => {
    const esi = createEsi(OPTIONS);
    expect(Object.isFrozen(esi)).toBe(true);
  });

  it('returns the same view for the same identity object', () => {
    const esi = createEsi(OPTIONS);
    const identity = identityFromToken('t');
    expect(esi.as(identity)).toBe(esi.as(identity));
    expect(esi.as(identity)).not.toBe(esi.as(identityFromToken('t')));
  });

  it('sends the tenant, compatibility date, language and datasource from every view', async () => {
    const esi = createEsi({
      ...OPTIONS,
      tenant: 'singularity',
      compatibilityDate: '2025-12-16',
      language: 'de',
      datasource: 'singularity',
    });
    fetchMock.mockResponses(JSON.stringify(STATUS), '12.5');

    await esi.public.status.get();
    await esi.as(identityFromToken('t')).character(1).wallet.get();

    for (const i of [0, 1]) {
      expect(sent(i).headers.get('x-tenant')).toBe('singularity');
      expect(sent(i).headers.get('x-compatibility-date')).toBe('2025-12-16');
      expect(sent(i).headers.get('accept-language')).toBe('de');
      expect(sent(i).url.searchParams.get('datasource')).toBe('singularity');
    }
  });

  it('sends the default compatibility date when none is given', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce(JSON.stringify(STATUS));

    await esi.public.status.get();

    expect(sent().headers.get('x-compatibility-date')).toBe(COMPATIBILITY_DATE);
  });

  it('builds one client per identity, shared by the plain and metadata views', () => {
    const forIdentity = jest.spyOn(ApiClient.prototype, 'forIdentity');
    try {
      const esi = createEsi(OPTIONS);
      const identity = identityFromToken('t');

      esi.as(identity);
      esi.withMetadata().as(identity);
      esi.withSafeMode().as(identity);

      expect(forIdentity).toHaveBeenCalledTimes(1);
    } finally {
      forIdentity.mockRestore();
    }
  });

  it('sends every request through the configured transport', async () => {
    const transport = jest.fn(
      async () =>
        new Response(JSON.stringify({ ...STATUS, players: 3 }), {
          status: 200,
        }),
    );
    const esi = createEsi({ ...OPTIONS, transport });

    await esi.public.status.get();
    await esi.as(identityFromToken('t')).status.get();

    expect(transport).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('runs the request and response interceptors on a view', async () => {
    const seen: string[] = [];
    const esi = createEsi({
      ...OPTIONS,
      requestInterceptors: [
        (req) => {
          seen.push(`request ${req.url}`);
          return req;
        },
      ],
      responseInterceptors: [
        (res) => {
          seen.push(`response ${res.status}`);
          return res;
        },
      ],
    });
    fetchMock.mockResponseOnce('12.5');

    await esi.as(identityFromToken('t')).character(1).wallet.get();

    expect(seen).toEqual([
      'request https://esi.evetech.net/characters/1/wallet',
      'response 200',
    ]);
  });

  it('does not ask a public operation for a token', async () => {
    const accessToken = jest.fn(() => Promise.resolve('t'));
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce(JSON.stringify(STATUS));

    await esi.as({ accessToken }).status.get();

    expect(accessToken).not.toHaveBeenCalled();
    expect(sent().headers.get('authorization')).toBeNull();
  });

  it('pages an authenticated collection under the identity token', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponses(
      [JSON.stringify([asset(1)]), { headers: { 'x-pages': '2' } }],
      [JSON.stringify([asset(2)]), { headers: { 'x-pages': '2' } }],
    );

    const ids: number[] = [];
    for await (const asset of esi
      .as(identityFromToken('t'))
      .character(1)
      .assets.get()) {
      ids.push(asset.item_id);
    }

    expect(ids).toEqual([1, 2]);
    expect(sent(0).headers.get('authorization')).toBe('Bearer t');
    expect(sent(1).headers.get('authorization')).toBe('Bearer t');
  });

  it('asks the identity for its token before each page', async () => {
    const esi = createEsi(OPTIONS);
    let calls = 0;
    const view = esi.as(
      identityFromProvider(() => Promise.resolve(`t${++calls}`)),
    );
    fetchMock.mockResponses(
      [JSON.stringify([asset(1)]), { headers: { 'x-pages': '2' } }],
      [JSON.stringify([asset(2)]), { headers: { 'x-pages': '2' } }],
    );

    const ids: number[] = [];
    for await (const asset of view.character(1).assets.get()) {
      ids.push(asset.item_id);
    }

    expect(ids).toEqual([1, 2]);
    expect(sent(0).headers.get('authorization')).toBe('Bearer t1');
    expect(sent(1).headers.get('authorization')).toBe('Bearer t2');
  });

  describe('DES-08: incompletePages', () => {
    const shrunk = () =>
      fetchMock.mockResponses(
        ['[{"item_id":1}]', { headers: { 'x-pages': '3' } }],
        ['[]', { headers: { 'x-pages': '3' } }],
      );
    const collect = async (pages: AsyncIterable<{ item_id: number }>) => {
      const ids: number[] = [];
      for await (const item of pages) ids.push(item.item_id);
      return ids;
    };

    it('by default a view stops at an empty page and yields what came before it', async () => {
      const esi = createEsi(OPTIONS);
      shrunk();

      const ids = await collect(
        esi.as(identityFromToken('t')).character(1).assets.get(),
      );

      expect(ids).toEqual([1]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("with 'throw' a view rejects the walk with an EsiPaginationError", async () => {
      const esi = createEsi({ ...OPTIONS, incompletePages: 'throw' });
      shrunk();

      await expect(
        collect(esi.as(identityFromToken('t')).character(1).assets.get()),
      ).rejects.toMatchObject({
        name: 'EsiPaginationError',
        reason: 'empty-page',
        fetchedPages: 2,
        itemCount: 1,
      });
    });

    it("with 'throw' the public view rejects a walk above the page limit after page 1", async () => {
      const esi = createEsi({
        ...OPTIONS,
        validateResponse: false,
        incompletePages: 'throw',
      });
      fetchMock.mockResponses([
        '[{"order_id":1}]',
        { headers: { 'x-pages': '1001' } },
      ]);

      const walk = async () => {
        for await (const order of esi.public
          .market(10000002)
          .orders.get({ order_type: 'all' })) {
          void order;
        }
      };

      await expect(walk()).rejects.toMatchObject({ reason: 'page-cap' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('caches a response under the token that asked, not the one the view holds when it lands', async () => {
    // Two concurrent wallet requests under different (not yet accepted)
    // tokens. The first answer arrives after the second request has replaced
    // the token; it must be stored under the first token's key, so a third
    // request under the still-unaccepted second token is not served without
    // ESI ever having seen that token.
    const esi = createEsi({ ...OPTIONS, enableRequestDeduplication: false });
    // The second token arrives a little later, so the first request has
    // already built its headers by the time the second replaces the token.
    const tokens = [
      ['t1', 0],
      ['t2', 5],
      ['t2', 0],
    ] as const;
    let call = 0;
    const view = esi.as(
      identityFromProvider(() => {
        const [token, delay] = tokens[call++]!;
        return new Promise((resolve) =>
          setTimeout(() => resolve(token), delay),
        );
      }),
    );
    const answer = (delay: number) => () =>
      new Promise<{ body: string; headers: Record<string, string> }>(
        (resolve) =>
          setTimeout(
            () => resolve({ body: '1', headers: { etag: '"w"' } }),
            delay,
          ),
      );
    fetchMock.mockResponseOnce(answer(10)).mockResponseOnce(answer(60));

    const wallet = view.character(1).wallet;
    const first = wallet.get();
    const second = wallet.get();
    await first;
    fetchMock.mockResponseOnce(answer(0));
    await wallet.get();
    await second;

    expect(fetchMock.mock.calls).toHaveLength(3);
    expect(sent(0).headers.get('authorization')).toBe('Bearer t1');
    expect(sent(2).headers.get('authorization')).toBe('Bearer t2');
  });

  it('shutdown stops the cleanup timers, more than once, and leaves the views usable', async () => {
    // A silent logger: the default pino logger keeps a flush timer of its
    // own, which is not the runtime's to stop.
    const noop = () => undefined;
    const silent = {
      fatal: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
    };
    jest.useFakeTimers();
    try {
      const esi = createEsi({ ...OPTIONS, logger: silent });
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      esi.shutdown();
      expect(jest.getTimerCount()).toBe(0);
      esi.shutdown();
      expect(jest.getTimerCount()).toBe(0);

      fetchMock.mockResponseOnce(JSON.stringify(STATUS));
      await expect(esi.public.status.get()).resolves.toEqual(STATUS);
    } finally {
      jest.useRealTimers();
    }
  });

  it('refuses an authenticated paged operation on the public view before the wire', async () => {
    const esi = createEsi(OPTIONS);
    const forced = esi.public as unknown as ReturnType<typeof esi.as>;

    const iterate = async () => {
      for await (const asset of forced.character(1).assets.get()) void asset;
    };

    await expect(iterate()).rejects.toThrow(/^\[NO_AUTH_TOKEN\] /);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('installs no token provider for an identity that cannot refresh', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce('{"error":"expired"}', { status: 401 });

    await expect(
      esi.as(identityFromToken('t')).character(1).wallet.get(),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes through the identity on a 401 and retries once', async () => {
    const tokens = ['first', 'second'];
    const identity: Identity = {
      accessToken: () => Promise.resolve(tokens[0]!),
      refreshAccessToken: () => Promise.resolve(tokens[1]!),
    };
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponses(
      ['{"error":"expired"}', { status: 401 }],
      ['12.5', { status: 200 }],
    );

    await expect(esi.as(identity).character(1).wallet.get()).resolves.toBe(
      12.5,
    );
    expect(sent(0).headers.get('authorization')).toBe('Bearer first');
    expect(sent(1).headers.get('authorization')).toBe('Bearer second');
  });

  it('rejects the call when the identity cannot supply a token', async () => {
    const esi = createEsi(OPTIONS);
    const identity = identityFromProvider(() =>
      Promise.reject(new Error('no session')),
    );

    await expect(esi.as(identity).character(1).wallet.get()).rejects.toThrow(
      'no session',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('validateResponse on the generated operations', () => {
    const statusWithoutPlayers = without(STATUS, 'players');
    const assetWithoutType = without(asset(1), 'type_id');

    async function callBoth(validateResponse?: boolean) {
      const esi = createEsi(
        validateResponse === undefined
          ? OPTIONS
          : { ...OPTIONS, validateResponse },
      );
      fetchMock.mockResponses(
        JSON.stringify(statusWithoutPlayers),
        JSON.stringify([assetWithoutType]),
      );
      const status = await esi.public.status.get().catch((e: unknown) => e);
      const assets: unknown[] = [];
      const paged = await (async () => {
        for await (const item of esi
          .as(identityFromToken('t'))
          .character(1)
          .assets.get()) {
          assets.push(item);
        }
        return assets;
      })().catch((e: unknown) => e);
      return { status, paged };
    }

    it('returns bodies unvalidated when the option is unset, as before validation existed', async () => {
      const { status, paged } = await callBoth();

      expect(status).toEqual(statusWithoutPlayers);
      expect(paged).toEqual([assetWithoutType]);
    });

    it('returns bodies unvalidated when the option is false', async () => {
      const { status, paged } = await callBoth(false);

      expect(status).toEqual(statusWithoutPlayers);
      expect(paged).toEqual([assetWithoutType]);
    });

    it('rejects a request and a page that break their schemas when the option is true', async () => {
      const { status, paged } = await callBoth(true);

      expect(status).toBeInstanceOf(EsiValidationError);
      expect(paged).toBeInstanceOf(EsiValidationError);
    });
  });
});

describe('createEsi metadata and safe-mode views', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('hands out the same views object, and the same view per identity, on every call', () => {
    const esi = createEsi(OPTIONS);
    const identity = identityFromToken('t');
    expect(esi.withMetadata()).toBe(esi.withMetadata());
    expect(esi.withSafeMode()).toBe(esi.withSafeMode());
    expect(esi.withMetadata().as(identity)).toBe(
      esi.withMetadata().as(identity),
    );
    expect(Object.isFrozen(esi.withSafeMode())).toBe(true);
  });

  it('wraps a thrown value that is not an EsiError in a fault result', async () => {
    const esi = createEsi(OPTIONS);
    const broken: Identity = {
      accessToken: () => Promise.reject(new Error('vault sealed')),
    };
    const result = await esi
      .withSafeMode()
      .as(broken)
      .character(1)
      .wallet.get();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect((result.error as { code?: string }).code).toBe('ESIJS_ERROR');
    expect(result.error.message).toBe('[ESIJS_ERROR] vault sealed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads the rate-limit and request headers into the metadata', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(1.5), {
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '149',
        'x-ratelimit-limit': '150',
        'x-ratelimit-used': '1',
        'x-ratelimit-group': 'char-wallet',
        'x-esi-request-id': 'req-1',
      },
    });
    const esi = createEsi(OPTIONS);
    const answer = await esi
      .withMetadata()
      .as(identityFromToken('t'))
      .character(1)
      .wallet.get();
    expect(answer.data).toBe(1.5);
    expect(answer.meta.rateLimit).toEqual({
      remaining: 149,
      limit: 150,
      used: 1,
      group: 'char-wallet',
    });
    expect(answer.meta.requestId).toBe('req-1');
  });
});

describe('createEsi diagnostics and supplied middleware', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('reports no circuit breaker statistics while the breaker is off', () => {
    const esi = createEsi(OPTIONS);
    expect(esi.getCircuitBreakerStats()).toBeNull();
    expect(esi.diagnostics.getDeduplicatorStats()).toEqual({
      pendingRequests: 0,
    });
  });

  it('reports no deduplicator statistics while deduplication is off', () => {
    const esi = createEsi({ ...OPTIONS, enableRequestDeduplication: false });
    expect(esi.diagnostics.getDeduplicatorStats()).toBeNull();
  });

  it('installs a supplied ICache as it is', async () => {
    const cache = new ETagCacheManager({ maxEntries: 5 });
    try {
      const esi = createEsi({ ...OPTIONS, cache });
      esi.updateCacheConfig({ maxEntries: 1 });
      expect(esi.getCacheStats()?.maxEntries).toBe(1);
      fetchMock.mockResponseOnce(JSON.stringify([1]), {
        headers: { 'content-type': 'application/json', etag: '"a"' },
      });
      await esi.public.alliances.get();
      expect(cache.getStats().totalEntries).toBe(1);
    } finally {
      cache.shutdown();
    }
  });

  it('does not change the limits of a supplied cache store', () => {
    const esi = createEsi({ ...OPTIONS, cache: new MemoryStore() });
    esi.updateCacheConfig({ maxEntries: 1 });
    expect(esi.getCacheStats()?.maxEntries).toBe(0);
  });

  it('ignores a supplied cache when the ETag cache is off', () => {
    const esi = createEsi({
      ...OPTIONS,
      cache: new MemoryStore(),
      enableETagCache: false,
    });
    expect(esi.getCacheStats()).toBeNull();
  });

  it('leaves a supplied circuit breaker and deduplicator to their owner on shutdown', () => {
    const circuitBreaker = new CircuitBreaker();
    const deduplicator = new RequestDeduplicator();
    const stop = jest.spyOn(circuitBreaker, 'shutdown');
    const clear = jest.spyOn(deduplicator, 'clear');
    const esi = createEsi({ ...OPTIONS, circuitBreaker, deduplicator });
    esi.shutdown();
    expect(stop).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it('resets one endpoint circuit by name', () => {
    const circuitBreaker = new CircuitBreaker({ failureThreshold: 1 });
    circuitBreaker.recordFailure('status', 500);
    circuitBreaker.recordFailure('alliances', 500);
    const esi = createEsi({ ...OPTIONS, circuitBreaker });
    esi.resetCircuitBreaker('status');
    expect(esi.getCircuitBreakerStats()?.openCircuits).toBe(1);
  });
});

class MemoryStore implements CacheStore {
  private readonly map = new Map<string, CachedResponse>();
  get(key: string): CachedResponse | null {
    return this.map.get(key) ?? null;
  }
  set(
    key: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
  ): void {
    this.map.set(key, { etag, data, headers, timestamp: 0 });
  }
  delete(key: string): boolean {
    return this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  shutdown(): void {}
}

describe('createEsi refusals and shutdown ownership', () => {
  beforeEach(() => fetchMock.resetMocks());

  const FIX = 'Fix: call it through esi.as(identity)';
  const built: Array<{ shutdown(): void }> = [];
  afterEach(() => {
    for (const esi of built.splice(0)) esi.shutdown();
  });

  it('names the scopes and the fix when the public view is asked for a scoped call', async () => {
    const esi = createEsi(OPTIONS);
    built.push(esi);
    const forced = esi.public as unknown as ReturnType<typeof esi.as>;
    const error: unknown = await Promise.resolve()
      .then(() => forced.character(1).wallet.get())
      .catch((e: unknown) => e);
    expect(String((error as Error).message)).toContain(
      'esi-wallet.read_character_wallet.v1',
    );
    expect(String((error as Error).message)).toContain(FIX);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('names the fix when the public view is asked to page a scoped collection', async () => {
    const esi = createEsi(OPTIONS);
    built.push(esi);
    const forced = esi.public as unknown as ReturnType<typeof esi.as>;
    const iterate = async () => {
      for await (const asset of forced.character(1).assets.get()) void asset;
    };
    await expect(iterate()).rejects.toThrow(FIX);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses an empty user agent with the reason', () => {
    expect(() => createEsi({ ...OPTIONS, userAgent: '' })).toThrow(
      'userAgent is required',
    );
  });

  it('refuses a user agent that would break the header', () => {
    expect(() =>
      createEsi({ ...OPTIONS, userAgent: 'app/1.0\r\nX-Evil: 1' }),
    ).toThrow(/^\[VALIDATION_ERROR\] /);
  });

  it('empties the cache through clearCache', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce(JSON.stringify([1]), {
      headers: { 'content-type': 'application/json', etag: '"a"' },
    });
    await esi.public.alliances.get();
    expect(esi.getCacheStats()?.totalEntries).toBe(1);
    esi.clearCache();
    expect(esi.getCacheStats()?.totalEntries).toBe(0);
    esi.shutdown();
  });

  it('leaves a supplied cache to its owner on shutdown', () => {
    const cache = new ETagCacheManager({ maxEntries: 5 });
    const stop = jest.spyOn(cache, 'shutdown');
    try {
      createEsi({ ...OPTIONS, cache }).shutdown();
      expect(stop).not.toHaveBeenCalled();
    } finally {
      cache.shutdown();
    }
  });

  it('stops the circuit breaker and clears the deduplicator it built itself', () => {
    const esi = createEsi({ ...OPTIONS, enableCircuitBreaker: true });
    const stop = jest.spyOn(CircuitBreaker.prototype, 'shutdown');
    const clear = jest.spyOn(RequestDeduplicator.prototype, 'clear');
    try {
      esi.shutdown();
      expect(stop).toHaveBeenCalled();
      expect(clear).toHaveBeenCalled();
    } finally {
      stop.mockRestore();
      clear.mockRestore();
    }
  });
});
