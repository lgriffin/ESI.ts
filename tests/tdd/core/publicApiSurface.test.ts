import * as ESI from '../../../src/index';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.test.local';
const TEST_CONFIG: ESI.EsiClientConfig = {
  baseUrl: BASE_URL,
  unsafeAllowCustomHost: true,
  enableETagCache: false,
};

describe('Public API Surface', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('Exported Classes', () => {
    it('should export EsiClient', () => {
      expect(ESI.EsiClient).toBeDefined();
      expect(typeof ESI.EsiClient).toBe('function');
    });

    it('should export EsiClientBuilder', () => {
      expect(ESI.EsiClientBuilder).toBeDefined();
      expect(typeof ESI.EsiClientBuilder).toBe('function');
    });

    it('should export EsiApiFactory', () => {
      expect(ESI.EsiApiFactory).toBeDefined();
      expect(typeof ESI.EsiApiFactory).toBe('function');
    });

    it('should export CustomEsiClient', () => {
      expect(ESI.CustomEsiClient).toBeDefined();
      expect(typeof ESI.CustomEsiClient).toBe('function');
    });

    it('should export ApiClient', () => {
      expect(ESI.ApiClient).toBeDefined();
      expect(typeof ESI.ApiClient).toBe('function');
    });

    it('should export ApiClientBuilder', () => {
      expect(ESI.ApiClientBuilder).toBeDefined();
      expect(typeof ESI.ApiClientBuilder).toBe('function');
    });

    it('should export BaseEsiClient', () => {
      expect(ESI.BaseEsiClient).toBeDefined();
      expect(typeof ESI.BaseEsiClient).toBe('function');
    });

    describe('Domain Clients', () => {
      const domainClients = [
        'AllianceClient',
        'AssetsClient',
        'CalendarClient',
        'CharacterClient',
        'ClonesClient',
        'ContactsClient',
        'ContractsClient',
        'CorporationsClient',
        'DogmaClient',
        'FactionClient',
        'FittingsClient',
        'FleetClient',
        'IncursionsClient',
        'IndustryClient',
        'InsuranceClient',
        'KillmailsClient',
        'LocationClient',
        'LoyaltyClient',
        'MailClient',
        'MarketClient',
        'PiClient',
        'RouteClient',
        'SearchClient',
        'CharacterSkillsClient',
        'SovereigntyClient',
        'StatusClient',
        'UiClient',
        'UniverseClient',
        'WalletClient',
        'WarsClient',
        'MetaClient',
        'FreelanceJobsClient',
        'SkyhooksClient',
        'MercenaryClient',
        'AccessListsClient',
      ] as const;

      it.each(domainClients)('should export %s', (clientName) => {
        const exported = (ESI as Record<string, unknown>)[clientName];
        expect(exported).toBeDefined();
        expect(typeof exported).toBe('function');
      });
    });

    it('should export EsiError', () => {
      expect(ESI.EsiError).toBeDefined();
      expect(typeof ESI.EsiError).toBe('function');
    });

    it('should export TimeoutError', () => {
      expect(ESI.TimeoutError).toBeDefined();
      expect(typeof ESI.TimeoutError).toBe('function');
    });

    it('should export CircuitBreaker', () => {
      expect(ESI.CircuitBreaker).toBeDefined();
      expect(typeof ESI.CircuitBreaker).toBe('function');
    });

    it('should export CircuitOpenError', () => {
      expect(ESI.CircuitOpenError).toBeDefined();
      expect(typeof ESI.CircuitOpenError).toBe('function');
    });

    it('should export RateLimiter', () => {
      expect(ESI.RateLimiter).toBeDefined();
      expect(typeof ESI.RateLimiter).toBe('function');
    });

    it('should export ETagCacheManager', () => {
      expect(ESI.ETagCacheManager).toBeDefined();
      expect(typeof ESI.ETagCacheManager).toBe('function');
    });

    it('should export RequestDeduplicator', () => {
      expect(ESI.RequestDeduplicator).toBeDefined();
      expect(typeof ESI.RequestDeduplicator).toBe('function');
    });

    it('should export EsiDiagnostics', () => {
      expect(ESI.EsiDiagnostics).toBeDefined();
      expect(typeof ESI.EsiDiagnostics).toBe('function');
    });

    it('should export buildEndpointPath', () => {
      expect(ESI.buildEndpointPath).toBeDefined();
      expect(typeof ESI.buildEndpointPath).toBe('function');
    });

    it('should export batchFetch', () => {
      expect(ESI.batchFetch).toBeDefined();
      expect(typeof ESI.batchFetch).toBe('function');
    });

    it('should export batchPost', () => {
      expect(ESI.batchPost).toBeDefined();
      expect(typeof ESI.batchPost).toBe('function');
    });

    it('should export fetchPages', () => {
      expect(ESI.fetchPages).toBeDefined();
      expect(typeof ESI.fetchPages).toBe('function');
    });

    it('should export setLogger', () => {
      expect(ESI.setLogger).toBeDefined();
      expect(typeof ESI.setLogger).toBe('function');
    });

    it('should export getDefaultClient', () => {
      expect(ESI.getDefaultClient).toBeDefined();
      expect(typeof ESI.getDefaultClient).toBe('function');
    });
  });

  describe('Exported Type Guards', () => {
    const typeGuards = [
      'isEsiError',
      'isRateLimited',
      'isNotFound',
      'isUnauthorized',
      'isForbidden',
      'isServerError',
      'isTimeout',
      'isRetryable',
    ] as const;

    it.each(typeGuards)(
      'should export %s as a callable function',
      (guardName) => {
        const guard = (ESI as Record<string, unknown>)[guardName];
        expect(guard).toBeDefined();
        expect(typeof guard).toBe('function');
      },
    );

    it('should return false for non-error values', () => {
      expect(ESI.isEsiError(new Error('plain'))).toBe(false);
      expect(ESI.isRateLimited(new Error('plain'))).toBe(false);
      expect(ESI.isNotFound(new Error('plain'))).toBe(false);
      expect(ESI.isUnauthorized(new Error('plain'))).toBe(false);
      expect(ESI.isForbidden(new Error('plain'))).toBe(false);
      expect(ESI.isServerError(new Error('plain'))).toBe(false);
      expect(ESI.isTimeout(new Error('plain'))).toBe(false);
    });

    it('should return true for matching EsiError instances', () => {
      const esiError = new ESI.EsiError(404, 'test');
      expect(ESI.isEsiError(esiError)).toBe(true);
      expect(ESI.isNotFound(esiError)).toBe(true);
    });

    it('should identify rate limited errors', () => {
      const rateLimitedError = new ESI.EsiError(420, 'rate limited');
      expect(ESI.isRateLimited(rateLimitedError)).toBe(true);
    });

    it('should identify unauthorized errors', () => {
      const unauthorizedError = new ESI.EsiError(401, 'unauthorized');
      expect(ESI.isUnauthorized(unauthorizedError)).toBe(true);
    });

    it('should identify forbidden errors', () => {
      const forbiddenError = new ESI.EsiError(403, 'forbidden');
      expect(ESI.isForbidden(forbiddenError)).toBe(true);
    });

    it('should identify server errors', () => {
      const serverError = new ESI.EsiError(500, 'server error');
      expect(ESI.isServerError(serverError)).toBe(true);
    });
  });

  describe('Exported Interfaces/Types (via usage)', () => {
    it('should accept EsiClientConfig in EsiClient constructor', () => {
      const config: ESI.EsiClientConfig = {
        clientId: 'type-test',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        accessToken: 'test',
        datasource: 'tranquility',
        timeout: 5000,
        language: 'en',
      };
      const client = new ESI.EsiClient(config);
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should export CircuitBreakerConfig (usable in constructor)', () => {
      const cbConfig: ESI.CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeoutMs: 10000,
      };
      const cb = new ESI.CircuitBreaker(cbConfig);
      expect(cb).toBeDefined();
      cb.shutdown();
    });

    it('should export ETagCacheConfig (usable in constructor)', () => {
      const cacheConfig: ESI.ETagCacheConfig = {
        maxEntries: 200,
        defaultTtl: 30000,
      };
      const cache = new ESI.ETagCacheManager(cacheConfig);
      expect(cache).toBeDefined();
      cache.shutdown();
    });

    it('should export RateLimiterConfig (usable in constructor)', () => {
      const rlConfig: ESI.RateLimiterConfig = {};
      const rl = new ESI.RateLimiter(rlConfig);
      expect(rl).toBeDefined();
    });

    it('should export RetryConfig (usable in EsiClientConfig)', () => {
      const retryConfig: ESI.RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 5000,
      };
      const client = new ESI.EsiClient({
        ...TEST_CONFIG,
        retryConfig,
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should export CacheStats type (returned by getCacheStats)', () => {
      const client = new ESI.EsiClient({
        ...TEST_CONFIG,
        enableETagCache: true,
      });
      const stats: ESI.CacheStats | null = client.getCacheStats();
      // Stats should be present when ETag cache is enabled
      expect(stats).not.toBeNull();
      client.shutdown();
    });

    it('should export CircuitBreakerStats type (returned by getCircuitBreakerStats)', () => {
      const client = new ESI.EsiClient({
        ...TEST_CONFIG,
        enableCircuitBreaker: true,
      });
      const stats: ESI.CircuitBreakerStats | null =
        client.getCircuitBreakerStats();
      expect(stats).not.toBeNull();
      client.shutdown();
    });
  });

  describe('EsiClient Domain Accessors', () => {
    let client: ESI.EsiClient;

    beforeEach(() => {
      client = new ESI.EsiClient(TEST_CONFIG);
    });

    afterEach(() => {
      client.shutdown();
    });

    const domainAccessors = [
      ['alliance', ESI.AllianceClient],
      ['assets', ESI.AssetsClient],
      ['calendar', ESI.CalendarClient],
      ['characters', ESI.CharacterClient],
      ['clones', ESI.ClonesClient],
      ['contacts', ESI.ContactsClient],
      ['contracts', ESI.ContractsClient],
      ['corporations', ESI.CorporationsClient],
      ['dogma', ESI.DogmaClient],
      ['factions', ESI.FactionClient],
      ['fittings', ESI.FittingsClient],
      ['fleets', ESI.FleetClient],
      ['incursions', ESI.IncursionsClient],
      ['industry', ESI.IndustryClient],
      ['insurance', ESI.InsuranceClient],
      ['killmails', ESI.KillmailsClient],
      ['location', ESI.LocationClient],
      ['loyalty', ESI.LoyaltyClient],
      ['mail', ESI.MailClient],
      ['market', ESI.MarketClient],
      ['pi', ESI.PiClient],
      ['route', ESI.RouteClient],
      ['search', ESI.SearchClient],
      ['skills', ESI.CharacterSkillsClient],
      ['sovereignty', ESI.SovereigntyClient],
      ['status', ESI.StatusClient],
      ['ui', ESI.UiClient],
      ['universe', ESI.UniverseClient],
      ['wallet', ESI.WalletClient],
      ['wars', ESI.WarsClient],
      ['meta', ESI.MetaClient],
      ['freelanceJobs', ESI.FreelanceJobsClient],
      ['skyhooks', ESI.SkyhooksClient],
      ['mercenary', ESI.MercenaryClient],
      ['accessLists', ESI.AccessListsClient],
    ] as const;

    it.each(domainAccessors)(
      'client.%s should return an instance of the correct class',
      (accessorName, expectedClass) => {
        const accessor = (client as unknown as Record<string, unknown>)[
          accessorName
        ];
        expect(accessor).toBeDefined();
        expect(accessor).toBeInstanceOf(expectedClass);
      },
    );

    it('should have exactly 35 domain accessors', () => {
      expect(domainAccessors).toHaveLength(35);
    });
  });

  describe('EsiClient Methods', () => {
    let client: ESI.EsiClient;

    beforeEach(() => {
      client = new ESI.EsiClient({
        ...TEST_CONFIG,
        enableETagCache: true,
        enableCircuitBreaker: true,
        enableRequestDeduplication: true,
      });
    });

    afterEach(() => {
      client.shutdown();
    });

    it('should have addRequestInterceptor method', () => {
      expect(typeof client.addRequestInterceptor).toBe('function');
    });

    it('should have addResponseInterceptor method', () => {
      expect(typeof client.addResponseInterceptor).toBe('function');
    });

    it('should have setAccessToken method', () => {
      expect(typeof client.setAccessToken).toBe('function');
    });

    it('should have setTokenProvider method', () => {
      expect(typeof client.setTokenProvider).toBe('function');
    });

    it('should have getCacheStats method', () => {
      expect(typeof client.getCacheStats).toBe('function');
    });

    it('should have clearCache method', () => {
      expect(typeof client.clearCache).toBe('function');
    });

    it('should have updateCacheConfig method', () => {
      expect(typeof client.updateCacheConfig).toBe('function');
    });

    it('should have getCircuitBreakerStats method', () => {
      expect(typeof client.getCircuitBreakerStats).toBe('function');
    });

    it('should have resetCircuitBreaker method', () => {
      expect(typeof client.resetCircuitBreaker).toBe('function');
    });

    it('should have batch method', () => {
      expect(typeof client.batch).toBe('function');
    });

    it('should have batchPost method', () => {
      expect(typeof client.batchPost).toBe('function');
    });

    it('should have shutdown method', () => {
      expect(typeof client.shutdown).toBe('function');
    });

    it('should have diagnostics getter', () => {
      expect(client.diagnostics).toBeDefined();
      expect(client.diagnostics).toBeInstanceOf(ESI.EsiDiagnostics);
    });

    it('addRequestInterceptor should return a removal function', () => {
      const remove = client.addRequestInterceptor((ctx) => ctx);
      expect(typeof remove).toBe('function');
      remove();
    });

    it('addResponseInterceptor should return a removal function', () => {
      const remove = client.addResponseInterceptor((ctx) => ctx);
      expect(typeof remove).toBe('function');
      remove();
    });

    it('setAccessToken should accept a string', () => {
      expect(() => {
        client.setAccessToken('new-token-value');
      }).not.toThrow();
    });

    it('setTokenProvider should accept a provider function', () => {
      expect(() => {
        client.setTokenProvider(async () => 'refreshed-token');
      }).not.toThrow();
    });

    it('setTokenProvider should accept undefined to remove provider', () => {
      expect(() => {
        client.setTokenProvider(undefined);
      }).not.toThrow();
    });

    it('getCacheStats should return stats when cache is enabled', () => {
      const stats = client.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats).toHaveProperty('totalEntries');
    });

    it('clearCache should not throw', () => {
      expect(() => {
        client.clearCache();
      }).not.toThrow();
    });

    it('getCircuitBreakerStats should return stats when circuit breaker is enabled', () => {
      const stats = client.getCircuitBreakerStats();
      expect(stats).not.toBeNull();
      expect(stats).toHaveProperty('openCircuits');
    });

    it('resetCircuitBreaker should not throw', () => {
      expect(() => {
        client.resetCircuitBreaker();
      }).not.toThrow();
    });
  });
});
