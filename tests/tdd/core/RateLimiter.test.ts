import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    limiter.reset();
    limiter.setTestMode(false);
  });

  afterEach(() => {
    limiter.setTestMode(true);
  });

  describe('constructor', () => {
    it('should return independent instances', () => {
      const a = new RateLimiter();
      const b = new RateLimiter();
      expect(a).not.toBe(b);
    });
  });

  describe('getTokenCost', () => {
    it('should return 2 for 2xx responses', () => {
      expect(RateLimiter.getTokenCost(200)).toBe(2);
      expect(RateLimiter.getTokenCost(201)).toBe(2);
      expect(RateLimiter.getTokenCost(299)).toBe(2);
    });

    it('should return 1 for 3xx responses', () => {
      expect(RateLimiter.getTokenCost(304)).toBe(1);
    });

    it('should return 5 for 4xx responses', () => {
      expect(RateLimiter.getTokenCost(400)).toBe(5);
      expect(RateLimiter.getTokenCost(404)).toBe(5);
      expect(RateLimiter.getTokenCost(429)).toBe(5);
    });

    it('should return 0 for 5xx responses', () => {
      expect(RateLimiter.getTokenCost(500)).toBe(0);
      expect(RateLimiter.getTokenCost(503)).toBe(0);
    });
  });

  describe('updateFromResponse', () => {
    it('should parse new rate limit headers', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '50',
          'x-ratelimit-limit': '100',
          'x-ratelimit-used': '50',
          'x-ratelimit-group': 'market',
        },
        200,
      );

      const status = limiter.getStatus();
      expect(status.remaining).toBe(50);
      expect(status.limit).toBe(100);
      expect(status.used).toBe(50);
      expect(status.group).toBe('market');
    });

    it('should parse legacy error limit headers', () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '85',
          'x-esi-error-limit-reset': '30',
        },
        404,
      );

      const status = limiter.getStatus();
      expect(status.errorLimitRemain).toBe(85);
      expect(status.errorLimitReset).toBe(30);
    });

    it('should parse both header sets simultaneously', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '40',
          'x-ratelimit-limit': '100',
          'x-ratelimit-used': '60',
          'x-esi-error-limit-remain': '90',
          'x-esi-error-limit-reset': '45',
        },
        200,
      );

      const status = limiter.getStatus();
      expect(status.remaining).toBe(40);
      expect(status.errorLimitRemain).toBe(90);
    });

    it('should set blockedUntil on 429 with Retry-After', () => {
      const before = Date.now();
      limiter.updateFromResponse(
        {
          'retry-after': '10',
        },
        429,
      );

      const status = limiter.getStatus();
      expect(status.retryAfter).toBe(10);
      expect(status.blockedUntil).toBeGreaterThanOrEqual(before + 10000);
      expect(limiter.isBlocked()).toBe(true);
    });

    it('should set blockedUntil on 420 with Retry-After', () => {
      limiter.updateFromResponse(
        {
          'retry-after': '60',
        },
        420,
      );

      const status = limiter.getStatus();
      expect(status.retryAfter).toBe(60);
      expect(limiter.isBlocked()).toBe(true);
    });

    it('should default to 60s block on 420/429 without Retry-After', () => {
      const before = Date.now();
      limiter.updateFromResponse({}, 429);

      const status = limiter.getStatus();
      expect(status.blockedUntil).toBeGreaterThanOrEqual(before + 59000);
      expect(limiter.isBlocked()).toBe(true);
    });

    it('should not block on normal 4xx errors', () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '95',
        },
        404,
      );

      expect(limiter.isBlocked()).toBe(false);
    });

    it('should skip updates in test mode', () => {
      limiter.setTestMode(true);
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '0',
          'retry-after': '60',
        },
        429,
      );

      const status = limiter.getStatus();
      expect(status.remaining).toBe(-1); // unchanged from default
      expect(limiter.isBlocked()).toBe(false);
    });
  });

  describe('updateRateLimitInfo (legacy method)', () => {
    it('should work as backwards-compatible wrapper', () => {
      limiter.updateRateLimitInfo({
        'x-ratelimit-remaining': '75',
        'x-ratelimit-limit': '100',
      });

      const status = limiter.getStatus();
      expect(status.remaining).toBe(75);
    });
  });

  describe('checkRateLimit', () => {
    it('should skip all delays in test mode', async () => {
      limiter.setTestMode(true);
      limiter.updateFromResponse({ 'retry-after': '60' }, 429);
      // Should not hang — test mode skips the update
      await limiter.checkRateLimit();
    });

    it('should enforce minimum delay between requests', async () => {
      // With test mode off and no rate limit data, minimum delay applies
      const start = Date.now();
      await limiter.checkRateLimit();
      await limiter.checkRateLimit();
      const elapsed = Date.now() - start;
      // Should take at least minDelayMs (50ms)
      expect(elapsed).toBeGreaterThanOrEqual(40); // allow small timing variance
    });
  });

  describe('reset', () => {
    it('should clear all rate limit state', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-limit': '100',
          'x-esi-error-limit-remain': '0',
          'retry-after': '60',
        },
        429,
      );

      limiter.reset();
      const status = limiter.getStatus();

      expect(status.remaining).toBe(-1);
      expect(status.limit).toBe(0);
      expect(status.used).toBe(0);
      expect(status.group).toBeNull();
      expect(status.errorLimitRemain).toBe(100);
      expect(status.errorLimitReset).toBe(0);
      expect(status.retryAfter).toBeNull();
      expect(status.blockedUntil).toBe(0);
      expect(limiter.isBlocked()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return a copy (not a reference)', () => {
      const status1 = limiter.getStatus();
      status1.remaining = 999;
      const status2 = limiter.getStatus();
      expect(status2.remaining).not.toBe(999);
    });
  });
});
