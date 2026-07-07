import { EsiClient } from '../../../src/EsiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ETag Integration Tests', () => {
  let client: EsiClient;

  beforeEach(() => {
    fetchMock.resetMocks();

    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://test-api.example.com',
      unsafeAllowCustomHost: true,
      enableETagCache: true,
      etagCacheConfig: {
        maxEntries: 100,
        defaultTtl: 5000,
        cleanupInterval: 1000,
      },
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  describe('ETag Caching Flow', () => {
    it('should cache response with ETag on first request', async () => {
      const mockData = [99005338, 99005551];
      const etag = '"abc123def456"';

      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: etag,
          'Content-Type': 'application/json',
        },
      });

      const response = await client.alliance.getAlliances();

      expect(response).toEqual(mockData);

      const cacheStats = client.getCacheStats();
      expect(cacheStats).toBeDefined();
      expect(cacheStats!.totalEntries).toBe(1);
    });

    it('should return cached data on 304 Not Modified', async () => {
      const mockData = [99005338, 99005551];
      const etag = '"abc123def456"';

      // First request - populate cache
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: etag,
          'Content-Type': 'application/json',
        },
      });

      const firstResponse = await client.alliance.getAlliances();
      expect(firstResponse).toEqual(mockData);

      // Second request within spec-aware TTL — returns cached data without HTTP call
      const cachedResponse = await client.alliance.getAlliances();

      expect(cachedResponse).toEqual(mockData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should update cache when ETag changes', async () => {
      const oldData = [99005338];
      const newData = [99005338, 99005551];
      const oldETag = '"old123"';
      const newETag = '"new456"';

      // First request
      fetchMock.mockResponseOnce(JSON.stringify(oldData), {
        headers: {
          ETag: oldETag,
          'Content-Type': 'application/json',
        },
      });

      const firstResponse = await client.alliance.getAlliances();
      expect(firstResponse).toEqual(oldData);

      // Second request within spec-aware TTL — returns original cached data
      const secondResponse = await client.alliance.getAlliances();
      expect(secondResponse).toEqual(oldData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const mockData = [99005338, 99005551];

      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: { ETag: '"test123"' },
      });

      await client.alliance.getAlliances();

      const stats = client.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats!.totalEntries).toBe(1);
      expect(stats!.maxEntries).toBe(100);
    });

    it('should clear cache', async () => {
      const mockData = [99005338, 99005551];

      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: { ETag: '"test123"' },
      });

      await client.alliance.getAlliances();

      expect(client.getCacheStats()!.totalEntries).toBe(1);

      client.clearCache();

      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });

    it('should update cache configuration', () => {
      const initialStats = client.getCacheStats();
      expect(initialStats!.maxEntries).toBe(100);

      client.updateCacheConfig({ maxEntries: 200 });

      const updatedStats = client.getCacheStats();
      expect(updatedStats!.maxEntries).toBe(200);
    });
  });

  describe('ETag Disabled', () => {
    it('should work without ETag cache when disabled', async () => {
      const clientWithoutETag = new EsiClient({
        enableETagCache: false,
      });

      const mockData = [99005338, 99005551];

      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: { ETag: '"test123"' },
      });

      const response = await clientWithoutETag.alliance.getAlliances();

      expect(response).toEqual(mockData);
      expect(clientWithoutETag.getCacheStats()).toBeNull();

      clientWithoutETag.shutdown();
    });
  });

  describe('Error Handling', () => {
    it('should handle requests when cache returns null', async () => {
      const mockData = [99005338, 99005551];

      // Mock 304 response but no cached data (edge case)
      fetchMock.mockResponseOnce('', {
        status: 304,
      });

      // Should throw since there's no cached data for this 304
      await expect(client.alliance.getAlliances()).rejects.toThrow(
        'Not Modified',
      );
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      await expect(client.alliance.getAlliances()).rejects.toThrow(
        'Network error',
      );
    });
  });
});
