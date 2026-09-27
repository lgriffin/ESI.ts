import { EsiClient, EsiClientConfig } from '../../../src/EsiClient';
import {
  CustomEsiClient,
  EsiApiFactory,
  EsiClientBuilder,
} from '../../../src/EsiClientBuilder';
import { IRetryStrategy } from '../../../src/core/IRetryStrategy';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

/**
 * Extracts the underlying ApiClient from domain client instances
 * by accessing the protected _client field.
 */
function getApiClientFromDomainClient(domainClient: unknown): unknown {
  return (domainClient as any)._client;
}

describe('Construction parity', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('default config', () => {
    it('all three surfaces should configure cache by default', () => {
      const esiClient = new EsiClient();
      const customClient = new EsiClientBuilder().addClient('status').build();
      const factoryClient = EsiApiFactory.createClient('status');

      // EsiClient: cache accessible via diagnostics
      const esiCacheStats = esiClient.getCacheStats();
      expect(esiCacheStats).toBeDefined();

      // CustomEsiClient: get ApiClient via domain client
      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      expect((customApiClient as any).getCache()).not.toBeNull();

      // EsiApiFactory: get ApiClient via domain client
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);
      expect((factoryApiClient as any).getCache()).not.toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('all three surfaces should configure deduplicator by default', () => {
      const esiClient = new EsiClient();
      const customClient = new EsiClientBuilder().addClient('status').build();
      const factoryClient = EsiApiFactory.createClient('status');

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getDeduplicator()).not.toBeNull();
      expect((factoryApiClient as any).getDeduplicator()).not.toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('all three surfaces should configure rate limiter by default', () => {
      const esiClient = new EsiClient();
      const customClient = new EsiClientBuilder().addClient('status').build();
      const factoryClient = EsiApiFactory.createClient('status');

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getRateLimiter()).not.toBeNull();
      expect((factoryApiClient as any).getRateLimiter()).not.toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('all three surfaces should NOT configure circuit breaker by default', () => {
      const esiClient = new EsiClient();
      const customClient = new EsiClientBuilder().addClient('status').build();
      const factoryClient = EsiApiFactory.createClient('status');

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      // Circuit breaker is opt-in, should be null by default
      expect((customApiClient as any).getCircuitBreaker()).toBeNull();
      expect((factoryApiClient as any).getCircuitBreaker()).toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });
  });

  describe('opt-out flags', () => {
    it('enableETagCache: false should disable cache for all three surfaces', () => {
      const config: EsiClientConfig = { enableETagCache: false };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getCache()).toBeNull();
      expect((factoryApiClient as any).getCache()).toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('enableRequestDeduplication: false should disable dedup for all three surfaces', () => {
      const config: EsiClientConfig = {
        enableRequestDeduplication: false,
      };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getDeduplicator()).toBeNull();
      expect((factoryApiClient as any).getDeduplicator()).toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });
  });

  describe('opt-in features', () => {
    it('enableCircuitBreaker: true should enable CB for all three surfaces', () => {
      const config: EsiClientConfig = { enableCircuitBreaker: true };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getCircuitBreaker()).not.toBeNull();
      expect((factoryApiClient as any).getCircuitBreaker()).not.toBeNull();

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('retryConfig should propagate for all three surfaces', () => {
      const config: EsiClientConfig = {
        retryConfig: { maxRetries: 5 },
      };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getRetryConfig()).toEqual({
        maxRetries: 5,
      });
      expect((factoryApiClient as any).getRetryConfig()).toEqual({
        maxRetries: 5,
      });

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('retryStrategy should propagate for all three surfaces', () => {
      const strategy: IRetryStrategy = {
        execute: jest.fn().mockResolvedValue('ok'),
      };
      const config: EsiClientConfig = { retryStrategy: strategy };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getRetryStrategy()).toBe(strategy);
      expect((factoryApiClient as any).getRetryStrategy()).toBe(strategy);

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('timeout should propagate for all three surfaces', () => {
      const config: EsiClientConfig = { timeout: 5000 };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getTimeout()).toBe(5000);
      expect((factoryApiClient as any).getTimeout()).toBe(5000);

      esiClient.shutdown();
      customClient.shutdown();
    });

    it('validateResponse should propagate for all three surfaces', () => {
      const config: EsiClientConfig = { validateResponse: false };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((customApiClient as any).getValidateResponse()).toBe(false);
      expect((factoryApiClient as any).getValidateResponse()).toBe(false);

      esiClient.shutdown();
      customClient.shutdown();
    });
  });

  describe('request headers', () => {
    it('compatibilityDate should propagate for all three surfaces', () => {
      const config: EsiClientConfig = { compatibilityDate: '2026-08-18' };
      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const esiApiClient = getApiClientFromDomainClient(esiClient.status);
      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      expect((esiApiClient as any).getCompatibilityDate()).toBe('2026-08-18');
      expect((customApiClient as any).getCompatibilityDate()).toBe(
        '2026-08-18',
      );
      expect((factoryApiClient as any).getCompatibilityDate()).toBe(
        '2026-08-18',
      );

      esiClient.shutdown();
      customClient.shutdown();
    });
  });

  describe('full config equivalence', () => {
    it('all middleware should match between EsiClient, CustomEsiClient, and EsiApiFactory', () => {
      const strategy: IRetryStrategy = {
        execute: jest.fn().mockResolvedValue('ok'),
      };
      const config: EsiClientConfig = {
        enableETagCache: true,
        enableRequestDeduplication: true,
        enableCircuitBreaker: true,
        circuitBreakerConfig: { failureThreshold: 5 },
        retryConfig: { maxRetries: 3 },
        retryStrategy: strategy,
        timeout: 10000,
        validateResponse: false,
      };

      const esiClient = new EsiClient(config);
      const customClient = new CustomEsiClient({
        ...config,
        clients: ['status'],
      });
      const factoryClient = EsiApiFactory.createClient('status', config);

      const customApiClient = getApiClientFromDomainClient(
        customClient.getClient('status'),
      );
      const factoryApiClient = getApiClientFromDomainClient(factoryClient);

      // Cache present
      expect((customApiClient as any).getCache()).not.toBeNull();
      expect((factoryApiClient as any).getCache()).not.toBeNull();

      // Deduplicator present
      expect((customApiClient as any).getDeduplicator()).not.toBeNull();
      expect((factoryApiClient as any).getDeduplicator()).not.toBeNull();

      // Rate limiter present
      expect((customApiClient as any).getRateLimiter()).not.toBeNull();
      expect((factoryApiClient as any).getRateLimiter()).not.toBeNull();

      // Circuit breaker present
      expect((customApiClient as any).getCircuitBreaker()).not.toBeNull();
      expect((factoryApiClient as any).getCircuitBreaker()).not.toBeNull();

      // Retry config
      expect((customApiClient as any).getRetryConfig()).toEqual({
        maxRetries: 3,
      });
      expect((factoryApiClient as any).getRetryConfig()).toEqual({
        maxRetries: 3,
      });

      // Retry strategy
      expect((customApiClient as any).getRetryStrategy()).toBe(strategy);
      expect((factoryApiClient as any).getRetryStrategy()).toBe(strategy);

      // Timeout
      expect((customApiClient as any).getTimeout()).toBe(10000);
      expect((factoryApiClient as any).getTimeout()).toBe(10000);

      // Validate response
      expect((customApiClient as any).getValidateResponse()).toBe(false);
      expect((factoryApiClient as any).getValidateResponse()).toBe(false);

      esiClient.shutdown();
      customClient.shutdown();
    });
  });
});
