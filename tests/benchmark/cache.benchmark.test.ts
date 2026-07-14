import { ETagCacheManager } from '../../src/core/cache/ETagCacheManager';

describe('ETagCacheManager benchmarks', () => {
  let cache: ETagCacheManager;

  afterEach(() => {
    cache?.shutdown();
  });

  it('set 1K entries under 500ms', () => {
    cache = new ETagCacheManager({ maxEntries: 2000 });

    const start = performance.now();

    for (let i = 0; i < 1_000; i++) {
      cache.set(
        `https://esi.evetech.net/v1/endpoint-${i}/`,
        `etag-${i}`,
        { data: i },
        { 'content-type': 'application/json' },
      );
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(cache.getStats().totalEntries).toBe(1000);
  });

  it('get (cache hits) 10K lookups under 500ms', () => {
    cache = new ETagCacheManager({ maxEntries: 2000 });

    for (let i = 0; i < 1_000; i++) {
      cache.set(
        `https://esi.evetech.net/v1/endpoint-${i}/`,
        `etag-${i}`,
        { data: i },
        { 'content-type': 'application/json' },
      );
    }

    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      cache.get(`https://esi.evetech.net/v1/endpoint-${i % 1000}/`);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('get (cache misses) 10K lookups under 500ms', () => {
    cache = new ETagCacheManager({ maxEntries: 2000 });

    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      cache.get(`https://esi.evetech.net/v1/nonexistent-${i}/`);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('eviction throughput: writing 2K entries to a 1K cache under 1s', () => {
    cache = new ETagCacheManager({ maxEntries: 1000 });

    const start = performance.now();

    for (let i = 0; i < 2_000; i++) {
      cache.set(
        `https://esi.evetech.net/v1/endpoint-${i}/`,
        `etag-${i}`,
        { data: i },
        { 'content-type': 'application/json' },
      );
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(cache.getStats().totalEntries).toBeLessThanOrEqual(1000);
  });

  it('cleanup cycle with 1K expired entries under 200ms', async () => {
    cache = new ETagCacheManager({ maxEntries: 2000, defaultTtl: 10 });

    for (let i = 0; i < 1_000; i++) {
      cache.set(
        `https://esi.evetech.net/v1/endpoint-${i}/`,
        `etag-${i}`,
        { data: i },
        { 'content-type': 'application/json' },
        10,
      );
    }

    await new Promise((r) => setTimeout(r, 20));

    const start = performance.now();
    const cleaned = cache.cleanup();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(cleaned).toBe(1000);
  });
});
