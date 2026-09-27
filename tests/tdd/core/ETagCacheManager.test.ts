import {
  ETagCacheManager,
  CacheEntry,
} from '../../../src/core/cache/ETagCacheManager';

/**
 * Every test runs on Jest's fake clock. The cache stamps entries with
 * Date.now() and sweeps them from a setInterval; on the real clock a test
 * either waits hundreds of milliseconds or races the boundary, and a mutant
 * of the expiry comparison is killed on one machine and survives on another.
 */
const START = 1_000_000;

describe('ETagCacheManager', () => {
  let cacheManager: ETagCacheManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: START });
    cacheManager = new ETagCacheManager({
      maxEntries: 5,
      defaultTtl: 1000, // 1 second for testing
      cleanupInterval: 500, // 0.5 seconds
    });
  });

  afterEach(() => {
    cacheManager.shutdown();
    jest.useRealTimers();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache entries', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      const etag = '"abc123"';
      const data = [{ alliance_id: 1, name: 'Test Alliance' }];
      const headers = { 'content-type': 'application/json' };

      cacheManager.set(url, etag, data, headers);
      const entry = cacheManager.get(url);

      expect(entry).toBeDefined();
      expect(entry?.etag).toBe(etag);
      expect(entry?.data).toEqual(data);
      expect(entry?.headers).toEqual(headers);
    });

    it('should return null for non-existent entries', () => {
      const entry = cacheManager.get('https://non-existent.url');
      expect(entry).toBeNull();
    });

    it('should check if entries exist', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      expect(cacheManager.has(url)).toBe(false);

      cacheManager.set(url, '"etag"', [], {});
      expect(cacheManager.has(url)).toBe(true);
    });

    it('should get ETag for URL', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      const etag = '"abc123"';

      expect(cacheManager.getETag(url)).toBeNull();

      cacheManager.set(url, etag, [], {});
      expect(cacheManager.getETag(url)).toBe(etag);
    });

    it('should delete specific entries', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      cacheManager.set(url, '"etag"', [], {});

      expect(cacheManager.has(url)).toBe(true);
      expect(cacheManager.delete(url)).toBe(true);
      expect(cacheManager.has(url)).toBe(false);
      expect(cacheManager.delete(url)).toBe(false); // Already deleted
    });

    it('should clear all entries', () => {
      cacheManager.set('url1', '"etag1"', [], {});
      cacheManager.set('url2', '"etag2"', [], {});

      expect(cacheManager.getStats().totalEntries).toBe(2);
      cacheManager.clear();
      expect(cacheManager.getStats().totalEntries).toBe(0);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      cacheManager.set(url, '"etag"', [], {}, 100); // 100ms TTL

      expect(cacheManager.has(url)).toBe(true);

      // An entry is still fresh at exactly its TTL...
      jest.advanceTimersByTime(100);
      expect(cacheManager.has(url)).toBe(true);

      // ...and expired one millisecond later.
      jest.advanceTimersByTime(1);
      expect(cacheManager.has(url)).toBe(false);
      expect(cacheManager.get(url)).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const url = 'https://esi.evetech.net/latest/alliances/';
      cacheManager.set(url, '"etag"', [], {}); // Use default TTL (1000ms)

      expect(cacheManager.get(url)?.ttl).toBe(1000);
      expect(cacheManager.has(url)).toBe(true);

      // Still valid at exactly the default TTL
      jest.setSystemTime(START + 1000);
      expect(cacheManager.has(url)).toBe(true);

      // Expired one millisecond after it
      jest.setSystemTime(START + 1001);
      expect(cacheManager.has(url)).toBe(false);
    });

    it('stamps each entry with the time it was stored', () => {
      cacheManager.set('url1', '"etag1"', [], {});
      jest.advanceTimersByTime(250);
      cacheManager.set('url2', '"etag2"', [], {});

      expect(cacheManager.get('url1')?.timestamp).toBe(START);
      expect(cacheManager.get('url2')?.timestamp).toBe(START + 250);
    });

    it('never expires an entry stored with a TTL of 0', () => {
      cacheManager.set('url1', '"etag1"', [], {}, 0);

      jest.setSystemTime(START + 10 * 365 * 24 * 60 * 60 * 1000);

      expect(cacheManager.has('url1')).toBe(true);
      expect(cacheManager.cleanup()).toBe(0);
    });
  });

  describe('Cache Size Management', () => {
    it('should evict oldest entries when max size reached', () => {
      // Fill cache to max capacity
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`url${i}`, `"etag${i}"`, [], {});
      }

      expect(cacheManager.getStats().totalEntries).toBe(5);

      // Add one more - should evict oldest
      cacheManager.set('url5', '"etag5"', [], {});

      expect(cacheManager.getStats().totalEntries).toBe(5);
      expect(cacheManager.has('url0')).toBe(false); // Oldest should be evicted
      expect(cacheManager.has('url5')).toBe(true); // Newest should be present
    });

    it('evicts by timestamp, not by insertion order', () => {
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`url${i}`, `"etag${i}"`, [], {});
        jest.advanceTimersByTime(10);
      }
      // Refreshing url0 keeps its place in the map but makes it the newest.
      cacheManager.set('url0', '"etag0b"', [], {});
      jest.advanceTimersByTime(10);

      cacheManager.set('url5', '"etag5"', [], {});

      expect(cacheManager.has('url0')).toBe(true);
      expect(cacheManager.has('url1')).toBe(false);
      expect(cacheManager.has('url5')).toBe(true);
    });

    it('should evict nothing when replacing an entry in a full cache', () => {
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`url${i}`, `"etag${i}"`, [], {});
      }

      cacheManager.set('url3', '"etag3b"', [], {});

      expect(cacheManager.getStats().totalEntries).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(cacheManager.has(`url${i}`)).toBe(true);
      }
      expect(cacheManager.getETag('url3')).toBe('"etag3b"');
    });
  });

  describe('Cleanup Operations', () => {
    it('should manually cleanup expired entries', () => {
      // Add entries with short TTL
      cacheManager.set('url1', '"etag1"', [], {}, 50);
      cacheManager.set('url2', '"etag2"', [], {}, 50);
      cacheManager.set('url3', '"etag3"', [], {}, 2000); // Long TTL

      expect(cacheManager.getStats().totalEntries).toBe(3);

      // At exactly the short TTL nothing has expired yet. setSystemTime moves
      // the clock without firing the cleanup interval, so only the manual
      // cleanup() below removes anything.
      jest.setSystemTime(START + 50);
      expect(cacheManager.cleanup()).toBe(0);

      jest.setSystemTime(START + 100);

      const cleanedCount = cacheManager.cleanup();
      expect(cleanedCount).toBe(2); // Should clean up 2 expired entries
      expect(cacheManager.getStats().totalEntries).toBe(1);
      expect(cacheManager.has('url3')).toBe(true); // Long TTL entry should remain
    });
  });

  describe('Scheduled cleanup', () => {
    it('sweeps expired entries every cleanupInterval', () => {
      cacheManager.set('short', '"a"', [], {}, 100);
      cacheManager.set('long', '"b"', [], {}, 5000);

      // Nothing is removed before the first tick at 500ms, even though the
      // short entry expired at 101ms: expiry alone does not delete an entry.
      jest.advanceTimersByTime(499);
      expect(cacheManager.getStats().totalEntries).toBe(2);

      jest.advanceTimersByTime(1);
      expect(cacheManager.getStats().totalEntries).toBe(1);
      expect(cacheManager.has('long')).toBe(true);
    });

    it('schedules one interval at the configured cleanupInterval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const manager = new ETagCacheManager({ cleanupInterval: 750 });

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 750);
      setIntervalSpy.mockRestore();

      manager.shutdown();
    });

    it('stops sweeping after shutdown', () => {
      cacheManager.set('short', '"a"', [], {}, 100);
      cacheManager.shutdown();

      jest.advanceTimersByTime(5000);

      // Only the interval would have removed the entry; the map still holds it.
      expect(cacheManager.getStats().totalEntries).toBe(1);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate statistics', () => {
      const stats = cacheManager.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.maxEntries).toBe(5);

      cacheManager.set('url1', '"etag1"', [], {});
      cacheManager.set('url2', '"etag2"', [], {});

      const newStats = cacheManager.getStats();
      expect(newStats.totalEntries).toBe(2);
      expect(newStats.oldestEntry).toBe(START);
      expect(newStats.newestEntry).toBe(START);
    });

    it('reports the oldest and newest entry timestamps', () => {
      cacheManager.set('url1', '"etag1"', [], {});
      jest.advanceTimersByTime(10);
      cacheManager.set('url2', '"etag2"', [], {});
      jest.advanceTimersByTime(20);
      cacheManager.set('url3', '"etag3"', [], {});

      const stats = cacheManager.getStats();
      expect(stats.oldestEntry).toBe(START);
      expect(stats.newestEntry).toBe(START + 30);
    });

    it('should track hits and misses', () => {
      cacheManager.set('url1', '"etag1"', [], {});

      cacheManager.get('url1'); // hit
      cacheManager.get('url1'); // hit
      cacheManager.get('url-miss'); // miss

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('should return hitRate of 0 when no lookups have occurred', () => {
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should count expired entries as misses', () => {
      cacheManager.set('url1', '"etag1"', [], {}, 50); // 50ms TTL

      cacheManager.get('url1'); // hit (still valid)
      jest.advanceTimersByTime(100);
      cacheManager.get('url1'); // miss (expired)

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.5);
    });

    it('should reset hit/miss counters on clear', () => {
      cacheManager.set('url1', '"etag1"', [], {});
      cacheManager.get('url1'); // hit
      cacheManager.get('url-miss'); // miss

      cacheManager.clear();
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('deleteByPath', () => {
    it('should delete entries matching path segment and return count', () => {
      cacheManager.set(
        'https://esi.evetech.net/v1/characters/123/',
        '"a"',
        [],
        {},
      );
      cacheManager.set(
        'https://esi.evetech.net/v1/characters/456/',
        '"b"',
        [],
        {},
      );
      cacheManager.set('https://esi.evetech.net/v1/alliances/', '"c"', [], {});

      const count = cacheManager.deleteByPath('/characters/');
      expect(count).toBe(2);
      expect(
        cacheManager.has('https://esi.evetech.net/v1/characters/123/'),
      ).toBe(false);
      expect(
        cacheManager.has('https://esi.evetech.net/v1/characters/456/'),
      ).toBe(false);
      expect(cacheManager.has('https://esi.evetech.net/v1/alliances/')).toBe(
        true,
      );
    });

    it('should return 0 when no entries match', () => {
      cacheManager.set('https://esi.evetech.net/v1/alliances/', '"a"', [], {});

      const count = cacheManager.deleteByPath('/characters/');
      expect(count).toBe(0);
    });

    it('should handle partial path matches', () => {
      cacheManager.set(
        'https://esi.evetech.net/v1/characters/123/assets/',
        '"a"',
        [],
        {},
      );
      cacheManager.set(
        'https://esi.evetech.net/v1/characters/123/wallet/',
        '"b"',
        [],
        {},
      );

      const count = cacheManager.deleteByPath('characters/123');
      expect(count).toBe(2);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const initialStats = cacheManager.getStats();
      expect(initialStats.maxEntries).toBe(5);

      cacheManager.updateConfig({ maxEntries: 10 });

      const updatedStats = cacheManager.getStats();
      expect(updatedStats.maxEntries).toBe(10);
    });

    it('keeps the current value for a setting passed as undefined', () => {
      cacheManager.updateConfig({ maxEntries: undefined });

      expect(cacheManager.getStats().maxEntries).toBe(5);
    });
  });
});
