import { ETagCacheManager, CacheEntry } from '../../../src/core/cache/ETagCacheManager';

describe('ETagCacheManager', () => {
    let cacheManager: ETagCacheManager;

    beforeEach(() => {
        cacheManager = new ETagCacheManager({
            maxEntries: 5,
            defaultTtl: 1000, // 1 second for testing
            cleanupInterval: 500, // 0.5 seconds
            persistToStorage: false
        });
    });

    afterEach(() => {
        cacheManager.shutdown();
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
        it('should expire entries after TTL', async () => {
            const url = 'https://esi.evetech.net/latest/alliances/';
            cacheManager.set(url, '"etag"', [], {}, 100); // 100ms TTL

            expect(cacheManager.has(url)).toBe(true);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(cacheManager.has(url)).toBe(false);
            expect(cacheManager.get(url)).toBeNull();
        });

        it('should use default TTL when not specified', async () => {
            const url = 'https://esi.evetech.net/latest/alliances/';
            cacheManager.set(url, '"etag"', [], {}); // Use default TTL (1000ms)

            expect(cacheManager.has(url)).toBe(true);

            // Should still be valid after 500ms
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(cacheManager.has(url)).toBe(true);

            // Should expire after 1100ms
            await new Promise(resolve => setTimeout(resolve, 600));
            expect(cacheManager.has(url)).toBe(false);
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
    });

    describe('Cleanup Operations', () => {
        it('should manually cleanup expired entries', async () => {
            // Add entries with short TTL
            cacheManager.set('url1', '"etag1"', [], {}, 50);
            cacheManager.set('url2', '"etag2"', [], {}, 50);
            cacheManager.set('url3', '"etag3"', [], {}, 2000); // Long TTL

            expect(cacheManager.getStats().totalEntries).toBe(3);

            // Wait for some to expire
            await new Promise(resolve => setTimeout(resolve, 100));

            const cleanedCount = cacheManager.cleanup();
            expect(cleanedCount).toBe(2); // Should clean up 2 expired entries
            expect(cacheManager.getStats().totalEntries).toBe(1);
            expect(cacheManager.has('url3')).toBe(true); // Long TTL entry should remain
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
            expect(newStats.oldestEntry).toBeDefined();
            expect(newStats.newestEntry).toBeDefined();
            expect(newStats.newestEntry).toBeGreaterThanOrEqual(newStats.oldestEntry!);
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
    });
});
