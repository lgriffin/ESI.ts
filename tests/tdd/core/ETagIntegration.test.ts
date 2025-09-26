import { EsiClient } from '../../../src/EsiClient';
import { initializeETagCache, getETagCache, resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ETag Integration Tests', () => {
    let client: EsiClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        
        // Reset the global cache to ensure clean state
        resetETagCache();
        
        client = new EsiClient({
            clientId: 'test-client',
            baseUrl: 'https://esi.evetech.net',
            enableETagCache: true,
            etagCacheConfig: {
                maxEntries: 100,
                defaultTtl: 5000,
                cleanupInterval: 1000
            }
        });
    });

    afterEach(() => {
        client.shutdown();
    });

    describe('ETag Caching Flow', () => {
        it('should cache response with ETag on first request', async () => {
            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];
            const etag = '"abc123def456"';

            fetchMock.mockResponseOnce(JSON.stringify(mockData), {
                headers: {
                    'ETag': etag,
                    'Content-Type': 'application/json'
                }
            });

            const result = await client.alliance.getAlliances();

            expect(result).toEqual(mockData);
            
            const cache = getETagCache();
            expect(cache).toBeDefined();
            
            const cacheStats = client.getCacheStats();
            expect(cacheStats.totalEntries).toBe(1);
        });

        it('should return cached data on 304 Not Modified', async () => {
            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];
            const etag = '"abc123def456"';

            // First request - populate cache
            fetchMock.mockResponseOnce(JSON.stringify(mockData), {
                headers: {
                    'ETag': etag,
                    'Content-Type': 'application/json'
                }
            });

            await client.alliance.getAlliances();

            // Second request - should return 304
            fetchMock.mockResponseOnce('', {
                status: 304,
                headers: {
                    'ETag': etag
                }
            });

            const cachedResult = await client.alliance.getAlliances();

            expect(cachedResult).toEqual(mockData);
            expect(fetchMock).toHaveBeenCalledTimes(2);
            
            // Verify If-None-Match header was sent
            const lastCall = fetchMock.mock.calls[1];
            const requestHeaders = lastCall[1]?.headers as Record<string, string>;
            expect(requestHeaders['If-None-Match']).toBe(etag);
        });

        it('should update cache when ETag changes', async () => {
            const oldData = [{ alliance_id: 1, name: 'Old Alliance' }];
            const newData = [{ alliance_id: 1, name: 'Updated Alliance' }];
            const oldETag = '"old123"';
            const newETag = '"new456"';

            // First request
            fetchMock.mockResponseOnce(JSON.stringify(oldData), {
                headers: {
                    'ETag': oldETag,
                    'Content-Type': 'application/json'
                }
            });

            const firstResult = await client.alliance.getAlliances();
            expect(firstResult).toEqual(oldData);

            // Second request with new ETag
            fetchMock.mockResponseOnce(JSON.stringify(newData), {
                headers: {
                    'ETag': newETag,
                    'Content-Type': 'application/json'
                }
            });

            const secondResult = await client.alliance.getAlliances();
            expect(secondResult).toEqual(newData);

            const cache = getETagCache();
            const url = 'https://esi.evetech.net/alliances';
            expect(cache?.getETag(url)).toBe(newETag);
        });
    });

    describe('Cache Management', () => {
        it('should provide cache statistics', async () => {
            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];

            fetchMock.mockResponseOnce(JSON.stringify(mockData), {
                headers: { 'ETag': '"test123"' }
            });

            await client.alliance.getAlliances();

            const stats = client.getCacheStats();
            expect(stats).toBeDefined();
            expect(stats.totalEntries).toBe(1);
            expect(stats.maxEntries).toBe(100);
        });

        it('should clear cache', async () => {
            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];

            fetchMock.mockResponseOnce(JSON.stringify(mockData), {
                headers: { 'ETag': '"test123"' }
            });

            await client.alliance.getAlliances();

            expect(client.getCacheStats().totalEntries).toBe(1);

            client.clearCache();

            expect(client.getCacheStats().totalEntries).toBe(0);
        });

        it('should update cache configuration', () => {
            const initialStats = client.getCacheStats();
            expect(initialStats.maxEntries).toBe(100);

            client.updateCacheConfig({ maxEntries: 200 });

            const updatedStats = client.getCacheStats();
            expect(updatedStats.maxEntries).toBe(200);
        });
    });

    describe('ETag Disabled', () => {
        it('should work without ETag cache when disabled', async () => {
            const clientWithoutETag = new EsiClient({
                enableETagCache: false
            });

            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];

            fetchMock.mockResponseOnce(JSON.stringify(mockData), {
                headers: { 'ETag': '"test123"' }
            });

            const result = await clientWithoutETag.alliance.getAlliances();

            expect(result).toEqual(mockData);
            expect(clientWithoutETag.getCacheStats()).toBeNull();

            clientWithoutETag.shutdown();
        });
    });

    describe('Error Handling', () => {
        it('should handle requests when cache returns null', async () => {
            const mockData = [{ alliance_id: 1, name: 'Test Alliance' }];

            // Mock 304 response but no cached data (edge case)
            fetchMock.mockResponseOnce('', {
                status: 304
            });

            // Should handle gracefully and not crash
            const result = await client.alliance.getAlliances();
            
            // Should return error object for 304 with no cache
            expect(result).toEqual({ error: 'not modified' });
        });

        it('should handle network errors gracefully', async () => {
            fetchMock.mockRejectOnce(new Error('Network error'));

            await expect(client.alliance.getAlliances()).rejects.toThrow('Network error');
        });
    });
});
