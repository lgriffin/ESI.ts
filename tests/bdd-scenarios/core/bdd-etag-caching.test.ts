/**
 * BDD-Style Testing for ETag Caching
 * 
 * This demonstrates BDD principles for ETag caching functionality
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { getETagCache, resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('BDD: ETag Caching System', () => {
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
        maxEntries: 50,
        defaultTtl: 300000 // 5 minutes
      }
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  describe('Feature: Efficient Data Caching with ETags', () => {
    describe('Scenario: First-time API request caches response', () => {
      it('Given a fresh client with no cached data, When I make an API request that returns an ETag, Then the response should be cached for future use', async () => {
        // Given: A fresh client with no cached data
        const allianceData = [
          { alliance_id: 99005338, name: 'Goonswarm Federation', ticker: 'CONDI' },
          { alliance_id: 99005551, name: 'Pandemic Horde', ticker: 'REKTD' }
        ];
        const etag = '"1234567890abcdef"';

        // Mock successful response with ETag
        fetchMock.mockResponseOnce(JSON.stringify(allianceData), {
          headers: {
            'ETag': etag,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        });

        // When: I make an API request that returns an ETag
        const result = await client.alliance.getAlliances();

        // Then: The response should be cached for future use
        expect(result).toEqual(allianceData);
        
        const cache = getETagCache();
        expect(cache).toBeDefined();
        
        const cacheStats = client.getCacheStats();
        expect(cacheStats.totalEntries).toBe(1);
        
        const cachedETag = cache?.getETag('https://esi.evetech.net/alliances');
        expect(cachedETag).toBe(etag);
      });
    });

    describe('Scenario: Subsequent request with unchanged data returns cached response', () => {
      it('Given cached data with an ETag, When I make the same request and server returns 304 Not Modified, Then I should receive the cached data without a new download', async () => {
        // Given: Cached data with an ETag
        const allianceData = [{ alliance_id: 99005338, name: 'Goonswarm Federation' }];
        const etag = '"cached123"';

        // First request to populate cache
        fetchMock.mockResponseOnce(JSON.stringify(allianceData), {
          headers: { 'ETag': etag, 'Content-Type': 'application/json' }
        });

        await client.alliance.getAlliances();

        // When: I make the same request and server returns 304 Not Modified
        fetchMock.mockResponseOnce('', {
          status: 304,
          headers: { 'ETag': etag }
        });

        const cachedResult = await client.alliance.getAlliances();

        // Then: I should receive the cached data without a new download
        expect(cachedResult).toEqual(allianceData);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        
        // Verify If-None-Match header was sent
        const secondRequest = fetchMock.mock.calls[1];
        const headers = secondRequest[1]?.headers as Record<string, string>;
        expect(headers['If-None-Match']).toBe(etag);
      });
    });

    describe('Scenario: Data changes trigger cache update', () => {
      it('Given cached data with an ETag, When the server returns new data with a different ETag, Then the cache should be updated with the new data', async () => {
        // Given: Cached data with an ETag
        const oldData = [{ alliance_id: 1, name: 'Old Alliance' }];
        const newData = [{ alliance_id: 1, name: 'Updated Alliance' }, { alliance_id: 2, name: 'New Alliance' }];
        const oldETag = '"old-etag-123"';
        const newETag = '"new-etag-456"';

        // First request
        fetchMock.mockResponseOnce(JSON.stringify(oldData), {
          headers: { 'ETag': oldETag }
        });

        const firstResult = await client.alliance.getAlliances();
        expect(firstResult).toEqual(oldData);

        // When: The server returns new data with a different ETag
        fetchMock.mockResponseOnce(JSON.stringify(newData), {
          headers: { 'ETag': newETag }
        });

        const updatedResult = await client.alliance.getAlliances();

        // Then: The cache should be updated with the new data
        expect(updatedResult).toEqual(newData);
        
        const cache = getETagCache();
        const cachedETag = cache?.getETag('https://esi.evetech.net/alliances');
        expect(cachedETag).toBe(newETag);
      });
    });
  });

  describe('Feature: Cache Management and Performance', () => {
    describe('Scenario: Cache statistics provide insight into performance', () => {
      it('Given multiple cached responses, When I request cache statistics, Then I should receive detailed information about cache usage', async () => {
        // Given: Multiple cached responses
        const endpoints = [
          { endpoint: 'alliances', data: [{ id: 1 }] },
          { endpoint: 'status', data: { status: 'ok' } }
        ];

        for (let i = 0; i < endpoints.length; i++) {
          fetchMock.mockResponseOnce(JSON.stringify(endpoints[i].data), {
            headers: { 'ETag': `"etag-${i}"` }
          });
        }

        await client.alliance.getAlliances();
        await client.status.getStatus();

        // When: I request cache statistics
        const stats = client.getCacheStats();

        // Then: I should receive detailed information about cache usage
        expect(stats).toBeDefined();
        expect(stats.totalEntries).toBe(2);
        expect(stats.maxEntries).toBe(50);
        expect(stats.oldestEntry).toBeDefined();
        expect(stats.newestEntry).toBeDefined();
      });
    });

    describe('Scenario: Cache can be manually cleared', () => {
      it('Given a cache with stored responses, When I clear the cache, Then all cached data should be removed', async () => {
        // Given: A cache with stored responses
        fetchMock.mockResponseOnce(JSON.stringify([]), {
          headers: { 'ETag': '"test-etag"' }
        });

        await client.alliance.getAlliances();
        expect(client.getCacheStats().totalEntries).toBe(1);

        // When: I clear the cache
        client.clearCache();

        // Then: All cached data should be removed
        expect(client.getCacheStats().totalEntries).toBe(0);
      });
    });

    describe('Scenario: Cache configuration can be updated at runtime', () => {
      it('Given a client with initial cache settings, When I update the cache configuration, Then the new settings should take effect', async () => {
        // Given: A client with initial cache settings
        const initialStats = client.getCacheStats();
        expect(initialStats.maxEntries).toBe(50);

        // When: I update the cache configuration
        client.updateCacheConfig({ 
          maxEntries: 100,
          defaultTtl: 600000 // 10 minutes
        });

        // Then: The new settings should take effect
        const updatedStats = client.getCacheStats();
        expect(updatedStats.maxEntries).toBe(100);
      });
    });
  });

  describe('Feature: Error Handling and Edge Cases', () => {
    describe('Scenario: Handle server errors gracefully with caching', () => {
      it('Given a cached response, When the server returns an error, Then the cached data should still be available', async () => {
        // Given: A cached response
        const validData = [{ alliance_id: 1, name: 'Test Alliance' }];
        const etag = '"valid-etag"';

        fetchMock.mockResponseOnce(JSON.stringify(validData), {
          headers: { 'ETag': etag }
        });

        const firstResult = await client.alliance.getAlliances();
        expect(firstResult).toEqual(validData);

        // When: The server returns an error
        fetchMock.mockResponseOnce('Server Error', { status: 500 });

        // Then: The request should return an error, but cached data should still be available
        const errorResult = await client.alliance.getAlliances() as any;
        expect(errorResult).toHaveProperty('error');
        expect(errorResult.error).toBe('internal server error');
        
        const cache = getETagCache();
        const cachedEntry = cache?.get('https://esi.evetech.net/alliances');
        expect(cachedEntry).toBeDefined();
        expect(cachedEntry?.data).toEqual(validData);
      });
    });

    describe('Scenario: Handle missing ETag headers gracefully', () => {
      it('Given a server response without ETag headers, When I make requests, Then the system should work normally without caching', async () => {
        // Given: A server response without ETag headers
        const data = [{ alliance_id: 1, name: 'Test Alliance' }];

        fetchMock.mockResponseOnce(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
          // No ETag header
        });

        // When: I make requests
        const result = await client.alliance.getAlliances();

        // Then: The system should work normally without caching
        expect(result).toEqual(data);
        expect(client.getCacheStats().totalEntries).toBe(0); // Nothing cached
      });
    });
  });

  describe('Feature: Cache Disabled Scenario', () => {
    describe('Scenario: Client works normally with caching disabled', () => {
      it('Given a client with ETag caching disabled, When I make API requests, Then responses should be returned normally without caching', async () => {
        // Given: A client with ETag caching disabled
        const clientWithoutCache = new EsiClient({
          enableETagCache: false
        });

        const data = [{ alliance_id: 1, name: 'Test Alliance' }];

        fetchMock.mockResponseOnce(JSON.stringify(data), {
          headers: { 'ETag': '"should-not-be-cached"' }
        });

        // When: I make API requests
        const result = await clientWithoutCache.alliance.getAlliances();

        // Then: Responses should be returned normally without caching
        expect(result).toEqual(data);
        expect(clientWithoutCache.getCacheStats()).toBeNull();

        clientWithoutCache.shutdown();
      });
    });
  });
});
