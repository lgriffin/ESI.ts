/**
 * The pipeline's ICache over a CacheStore port (EsiOptions.cache), and the
 * clock the middleware takes (EsiOptions.clock).
 */
import type {
  CachedResponse,
  CacheStore,
  Clock,
} from '../../../src/core/ports';
import {
  CacheStoreCache,
  cacheFromStore,
  MAX_TRACKED_KEYS,
} from '../../../src/core/cache/CacheStoreCache';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

class MapStore implements CacheStore {
  readonly map = new Map<string, CachedResponse>();
  shutdowns = 0;
  get(key: string): CachedResponse | null {
    return this.map.get(key) ?? null;
  }
  set(
    key: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    ttlMs?: number,
  ): void {
    this.map.set(key, {
      etag,
      data,
      headers,
      timestamp: 7,
      ...(ttlMs === undefined ? {} : { ttl: ttlMs }),
    });
  }
  delete(key: string): boolean {
    return this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  shutdown(): void {
    this.shutdowns += 1;
  }
}

function fixedClock(start = 1_000): Clock & { advance(ms: number): void } {
  let now = start;
  return {
    now: () => now,
    sleep: () => Promise.resolve(),
    advance: (ms) => {
      now += ms;
    },
  };
}

describe('CacheStoreCache', () => {
  it('reads and writes through the store, counting hits and misses', () => {
    const store = new MapStore();
    const cache = new CacheStoreCache(store, fixedClock(42));
    expect(cache.get('a')).toBeNull();
    cache.set('a', '"1"', { x: 1 }, { etag: '"1"' }, 500);
    expect(cache.get('a')).toEqual({
      etag: '"1"',
      data: { x: 1 },
      headers: { etag: '"1"' },
      timestamp: 42,
      ttl: 500,
    });
    expect(cache.getETag('a')).toBe('"1"');
    expect(cache.getETag('b')).toBeNull();
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.getStats()).toEqual({
      totalEntries: 1,
      maxEntries: 0,
      hits: 2,
      misses: 2,
      hitRate: 0.5,
      oldestEntry: null,
      newestEntry: null,
    });
  });

  it('leaves out a ttl the store did not keep', () => {
    const cache = new CacheStoreCache(new MapStore());
    cache.set('a', '"1"', 1, {});
    expect(cache.get('a')).not.toHaveProperty('ttl');
  });

  it('invalidates by path only the keys it wrote', () => {
    const store = new MapStore();
    store.set('other/characters/1/assets', '"x"', 1, {});
    const cache = new CacheStoreCache(store);
    cache.set('characters/1/assets?page=1', '"1"', 1, {});
    cache.set('characters/1/wallet', '"2"', 2, {});
    expect(cache.deleteByPath('characters/1/assets')).toBe(1);
    expect(store.map.has('other/characters/1/assets')).toBe(true);
    expect(cache.delete('characters/1/wallet')).toBe(true);
    expect(cache.getStats().totalEntries).toBe(0);
  });

  it('forgets a key the store has dropped', () => {
    const store = new MapStore();
    const cache = new CacheStoreCache(store);
    cache.set('a', '"1"', 1, {});
    store.map.delete('a');
    expect(cache.get('a')).toBeNull();
    expect(cache.getStats().totalEntries).toBe(0);
  });

  it('clears and shuts down the store', () => {
    const store = new MapStore();
    const cache = new CacheStoreCache(store);
    cache.set('a', '"1"', 1, {});
    cache.get('a');
    cache.clear();
    expect(store.map.size).toBe(0);
    expect(cache.getStats()).toMatchObject({ hits: 0, totalEntries: 0 });
    cache.shutdown();
    expect(store.shutdowns).toBe(1);
  });
});

describe('cacheFromStore', () => {
  it('uses a store that is already an ICache as it is', () => {
    const cache = new ETagCacheManager();
    try {
      expect(cacheFromStore(cache)).toBe(cache);
    } finally {
      cache.shutdown();
    }
  });

  it('adapts a plain store', () => {
    expect(cacheFromStore(new MapStore())).toBeInstanceOf(CacheStoreCache);
  });

  it('hands every client given one store the same adapter, so one write invalidates what the others cached', () => {
    const store = new MapStore();
    const first = cacheFromStore(store);
    const second = cacheFromStore(store);
    expect(second).toBe(first);
    first.set('characters/1/contacts/', '"1"', [], {});
    expect(second.deleteByPath('characters/1/contacts')).toBe(1);
    expect(store.map.size).toBe(0);
  });
});

describe('CacheStoreCache timestamps and bounds', () => {
  it('stamps an entry it wrote with its own clock, not the store time base', () => {
    const cache = new CacheStoreCache(new MapStore(), fixedClock(5_000));
    cache.set('a', '"1"', 1, {});
    expect(cache.get('a')?.timestamp).toBe(5_000);
  });

  it('falls back to the store timestamp for an entry another process wrote', () => {
    const store = new MapStore();
    store.set('a', '"1"', 1, {});
    expect(
      new CacheStoreCache(store, fixedClock(5_000)).get('a')?.timestamp,
    ).toBe(7);
  });

  it('remembers at most MAX_TRACKED_KEYS written keys, forgetting the oldest first', () => {
    const cache = new CacheStoreCache(new MapStore(), fixedClock());
    for (let i = 0; i <= MAX_TRACKED_KEYS; i += 1) {
      cache.set(`k${i}`, '"1"', i, {});
    }
    expect(cache.getStats().totalEntries).toBe(MAX_TRACKED_KEYS);
    expect(cache.deleteByPath('k0')).toBe(0);
  });
});

describe('middleware on a supplied clock', () => {
  it('ages ETag cache entries by the clock', () => {
    const clock = fixedClock();
    const cache = new ETagCacheManager({}, null, clock);
    try {
      cache.set('a', '"1"', 1, {}, 1_000);
      expect(cache.getStats().newestEntry).toBe(1_000);
      clock.advance(999);
      expect(cache.has('a')).toBe(true);
      clock.advance(2);
      expect(cache.has('a')).toBe(false);
    } finally {
      cache.shutdown();
    }
  });

  it('half-opens a circuit after the reset timeout by the clock', () => {
    const clock = fixedClock();
    const breaker = new CircuitBreaker(
      { failureThreshold: 1, resetTimeoutMs: 5_000 },
      clock,
    );
    breaker.recordFailure('status', 500);
    expect(() => breaker.checkCircuit('status')).toThrow();
    clock.advance(5_000);
    expect(() => breaker.checkCircuit('status')).not.toThrow();
    expect(breaker.getState('status')).toBe('half-open');
  });

  it('waits out a rate-limit block on the clock', async () => {
    const clock = fixedClock();
    const waits: number[] = [];
    clock.sleep = (ms) => {
      waits.push(ms);
      clock.advance(ms);
      return Promise.resolve();
    };
    const limiter = new RateLimiter({ minDelayMs: 0 }, clock);
    limiter.updateFromResponse({ 'retry-after': '2' }, 429, 'status', 'GET');
    await limiter.checkRateLimit('status', 'GET');
    expect(waits.length).toBeGreaterThan(0);
    expect(waits.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(2_000);
  });
});
