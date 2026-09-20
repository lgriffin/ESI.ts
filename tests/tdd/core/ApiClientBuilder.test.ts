import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';

describe('ApiClientBuilder', () => {
  it('should build a client with required fields', () => {
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .build();

    expect(client).toBeDefined();
    expect(client.getLink()).toBe('https://esi.evetech.net');
  });

  it('should set access token on the built client', () => {
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .setAccessToken('my-token')
      .build();

    expect(client.getAuthorizationHeader()).toBe('Bearer my-token');
  });

  it('should inject cache via setCache', () => {
    const cache = new ETagCacheManager({ maxEntries: 10 });
    try {
      const client = new ApiClientBuilder()
        .setClientId('test')
        .setLink('https://esi.evetech.net')
        .setCache(cache)
        .build();

      expect(client.getCache()).toBe(cache);
    } finally {
      cache.shutdown();
    }
  });

  it('should inject circuit breaker via setCircuitBreaker', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .setCircuitBreaker(cb)
      .build();

    expect(client.getCircuitBreaker()).toBe(cb);
    cb.shutdown();
  });

  it('should set timeout via setTimeout', () => {
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .setTimeout(5000)
      .build();

    expect(client.getTimeout()).toBe(5000);
  });

  it('should support method chaining', () => {
    const builder = new ApiClientBuilder();
    const result = builder
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .setAccessToken('token')
      .setTimeout(10000);

    expect(result).toBe(builder);
  });

  it('should use a default rate limiter when none provided', () => {
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .build();

    expect(client.getRateLimiter()).toBeDefined();
  });

  it('should use the provided rate limiter over default', () => {
    const limiter = new RateLimiter();
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .setRateLimiter(limiter)
      .build();

    expect(client.getRateLimiter()).toBe(limiter);
  });

  it('should not set cache or circuit breaker by default', () => {
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .build();

    expect(client.getCache()).toBeNull();
    expect(client.getCircuitBreaker()).toBeNull();
  });
});
