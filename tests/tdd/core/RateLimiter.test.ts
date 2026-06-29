import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { esiRateLimitGroups } from '../../../src/core/endpoints/esi-rate-limit-groups.generated';
import * as sleepModule from '../../../src/core/util/sleep';

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

  describe('getTokenCost edge cases', () => {
    it('should return default cost (2) for out-of-range status codes', () => {
      expect(RateLimiter.getTokenCost(600)).toBe(2);
      expect(RateLimiter.getTokenCost(100)).toBe(2);
      expect(RateLimiter.getTokenCost(0)).toBe(2);
      expect(RateLimiter.getTokenCost(-1)).toBe(2);
    });
  });

  describe('checkRateLimit delay paths', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should wait and clear block when blockedUntil is in the future', async () => {
      limiter.updateFromResponse({ 'retry-after': '10' }, 429);

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalled();
      const sleepArg = sleepSpy.mock.calls[0][0] as number;
      expect(sleepArg).toBeGreaterThan(0);
      expect(sleepArg).toBeLessThanOrEqual(10000);

      expect(limiter.isBlocked()).toBe(false);
      expect(limiter.getStatus().retryAfter).toBeNull();
    });

    it('should slow down when legacy error limit is low (1-10)', async () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '5',
          'x-esi-error-limit-reset': '10',
        },
        404,
      );

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalled();
      const sleepArg = sleepSpy.mock.calls[0][0] as number;
      expect(sleepArg).toBeLessThanOrEqual(5000);
    });

    it('should wait full reset time when legacy error limit is exhausted', async () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '0',
          'x-esi-error-limit-reset': '120',
        },
        404,
      );

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalledWith(120000);
    });

    it('should wait 1s when token bucket is empty', async () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-limit': '100',
        },
        200,
      );

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalledWith(1000);
    });

    it('should apply proactive deceleration when ratio is below threshold', async () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '10',
          'x-ratelimit-limit': '100',
        },
        200,
      );

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalled();
      const sleepArg = sleepSpy.mock.calls[0][0] as number;
      expect(sleepArg).toBeGreaterThan(0);
      expect(sleepArg).toBeLessThanOrEqual(1000);
    });
  });

  describe('generated rate limit groups', () => {
    it('should contain market-order group for market orders endpoint', () => {
      const spec = esiRateLimitGroups['GET:markets/{region_id}/orders'];
      expect(spec).toBeDefined();
      expect(spec!.group).toBe('market-order');
      expect(spec!.maxTokens).toBe(12000);
      expect(spec!.windowSizeMs).toBe(900000);
    });

    it('should contain char-notification group with low token limit', () => {
      const spec =
        esiRateLimitGroups['GET:characters/{character_id}/notifications'];
      expect(spec).toBeDefined();
      expect(spec!.group).toBe('char-notification');
      expect(spec!.maxTokens).toBe(15);
    });

    it('should use snake_case parameter names in keys', () => {
      expect(
        esiRateLimitGroups['GET:characters/{character_id}/assets'],
      ).toBeDefined();
      expect(
        esiRateLimitGroups['GET:characters/{characterId}/assets'],
      ).toBeUndefined();
    });
  });

  describe('per-group bucket creation', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should create a bucket from spec when templatePath matches', async () => {
      await limiter.checkRateLimit('markets/{regionId}/orders', 'GET');

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '11998',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-used': '2',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const groupStatus = limiter.getGroupStatus('market-order');
      expect(groupStatus).toBeDefined();
      expect(groupStatus!.group).toBe('market-order');
      expect(groupStatus!.remaining).toBe(11998);
      expect(groupStatus!.limit).toBe(12000);
    });

    it('should use fallback bucket when no templatePath provided', async () => {
      await limiter.checkRateLimit();
      const status = limiter.getStatus();
      expect(status.group).toBeNull();
    });
  });

  describe('group isolation', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should not block group B when group A is rate limited', async () => {
      limiter.updateFromResponse(
        { 'retry-after': '60' },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(limiter.isBlocked('char-notification')).toBe(true);

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '11990',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-used': '10',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      expect(limiter.isBlocked('market-order')).toBe(false);
    });

    it('should track separate remaining counts per group', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '10',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '5',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
      );

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '11000',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-used': '1000',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const notifStatus = limiter.getGroupStatus('char-notification');
      const marketStatus = limiter.getGroupStatus('market-order');

      expect(notifStatus!.remaining).toBe(10);
      expect(marketStatus!.remaining).toBe(11000);
    });
  });

  describe('server sync overrides spec', () => {
    it('should use server-provided limit over spec default', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '500',
          'x-ratelimit-limit': '600',
          'x-ratelimit-used': '100',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const groupStatus = limiter.getGroupStatus('market-order');
      expect(groupStatus!.limit).toBe(600);
    });
  });

  describe('per-group 429 blocking', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should block only the affected group on 429', () => {
      limiter.updateFromResponse(
        { 'retry-after': '30' },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(limiter.isBlocked('char-notification')).toBe(true);
      expect(limiter.isBlocked('market-order')).toBe(false);
      expect(limiter.isBlocked()).toBe(true);
    });

    it('should wait group-specific block time in checkRateLimit', async () => {
      limiter.updateFromResponse(
        { 'retry-after': '5' },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      await limiter.checkRateLimit(
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(sleepSpy).toHaveBeenCalled();
      const sleepArg = sleepSpy.mock.calls[0][0] as number;
      expect(sleepArg).toBeGreaterThan(0);
      expect(sleepArg).toBeLessThanOrEqual(5000);
    });
  });

  describe('per-user bucketing', () => {
    let userLimiter: RateLimiter;

    beforeEach(() => {
      userLimiter = new RateLimiter({
        userKeyExtractor: (headers) => headers['authorization'] ?? 'anon',
      });
      userLimiter.setTestMode(false);
    });

    afterEach(() => {
      userLimiter.setTestMode(true);
    });

    it('should create separate bucket sets for different users', () => {
      const userAHeaders = { authorization: 'Bearer user-a-token' };
      const userBHeaders = { authorization: 'Bearer user-b-token' };

      userLimiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '5',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '10',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
        userAHeaders,
      );

      userLimiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '14',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '1',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
        userBHeaders,
      );

      const status = userLimiter.getStatus();
      expect(status.remaining).toBe(5);
    });

    it('should use default buckets when no request headers provided', () => {
      userLimiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '90',
          'x-ratelimit-limit': '100',
          'x-ratelimit-used': '10',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const groupStatus = userLimiter.getGroupStatus('market-order');
      expect(groupStatus).toBeDefined();
      expect(groupStatus!.remaining).toBe(90);
    });
  });

  describe('getGroupStatus and getAllGroupStatuses', () => {
    it('should return undefined for unknown group', () => {
      expect(limiter.getGroupStatus('nonexistent')).toBeUndefined();
    });

    it('should return all active groups', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '10',
          'x-ratelimit-limit': '15',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
      );

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '11000',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const all = limiter.getAllGroupStatuses();
      expect(all.size).toBe(2);
      expect(all.has('char-notification')).toBe(true);
      expect(all.has('market-order')).toBe(true);
    });
  });

  describe('getStatus backward compatibility', () => {
    it('should return worst-case group in getStatus', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '2',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '13',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
      );

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '11000',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-used': '1000',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const status = limiter.getStatus();
      expect(status.group).toBe('char-notification');
      expect(status.remaining).toBe(2);
      expect(status.limit).toBe(15);
    });

    it('should return RateLimitInfo shape with all expected fields', () => {
      const status = limiter.getStatus();
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('limit');
      expect(status).toHaveProperty('used');
      expect(status).toHaveProperty('group');
      expect(status).toHaveProperty('errorLimitRemain');
      expect(status).toHaveProperty('errorLimitReset');
      expect(status).toHaveProperty('retryAfter');
      expect(status).toHaveProperty('blockedUntil');
    });
  });

  describe('isBlocked specificity', () => {
    it('should report specific group blocked', () => {
      limiter.updateFromResponse(
        { 'retry-after': '10' },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(limiter.isBlocked('char-notification')).toBe(true);
      expect(limiter.isBlocked('market-order')).toBe(false);
    });

    it('should report any blocked when called without group', () => {
      limiter.updateFromResponse(
        { 'retry-after': '10' },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(limiter.isBlocked()).toBe(true);
    });

    it('should report not blocked when no groups are blocked', () => {
      expect(limiter.isBlocked()).toBe(false);
      expect(limiter.isBlocked('market-order')).toBe(false);
    });
  });

  describe('reset clears all groups', () => {
    it('should clear all group buckets and user buckets', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-limit': '15',
          'x-ratelimit-group': 'char-notification',
          'retry-after': '60',
        },
        429,
        'characters/{characterId}/notifications',
        'GET',
      );

      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '100',
          'x-ratelimit-limit': '12000',
          'x-ratelimit-group': 'market-order',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      limiter.reset();

      expect(limiter.getAllGroupStatuses().size).toBe(0);
      expect(limiter.isBlocked()).toBe(false);
      expect(limiter.getGroupStatus('char-notification')).toBeUndefined();
      expect(limiter.getGroupStatus('market-order')).toBeUndefined();
    });
  });

  describe('per-group deceleration', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should decelerate only the group with low tokens', async () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '1',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '14',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
      );

      sleepSpy.mockClear();
      await limiter.checkRateLimit(
        'characters/{characterId}/notifications',
        'GET',
      );

      expect(sleepSpy).toHaveBeenCalled();
      const sleepArg = sleepSpy.mock.calls[0][0] as number;
      expect(sleepArg).toBeGreaterThan(0);
    });
  });

  describe('response group header is authoritative', () => {
    it('should use x-ratelimit-group from response over spec lookup', () => {
      limiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '500',
          'x-ratelimit-limit': '600',
          'x-ratelimit-used': '100',
          'x-ratelimit-group': 'custom-override-group',
        },
        200,
        'markets/{regionId}/orders',
        'GET',
      );

      const overrideStatus = limiter.getGroupStatus('custom-override-group');
      expect(overrideStatus).toBeDefined();
      expect(overrideStatus!.remaining).toBe(500);

      const specStatus = limiter.getGroupStatus('market-order');
      expect(specStatus).toBeUndefined();
    });
  });
});
