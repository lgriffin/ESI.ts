import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { esiRateLimitGroups } from '../../../src/core/endpoints/esi-rate-limit-groups.generated';
import * as sleepModule from '../../../src/core/util/sleep';

/**
 * The limiter reads Date.now() for blocks and the minimum delay, and waits
 * through sleep() (a setTimeout). Every test runs on Jest's fake clock, frozen
 * at START until a test moves it, so the delay each path asks for can be
 * asserted exactly instead of bounded against however long a real wait took.
 */
const START = 1_000_000;

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers({ now: START });
    limiter = new RateLimiter();
    limiter.reset();
    limiter.setTestMode(false);
  });

  afterEach(() => {
    limiter.setTestMode(true);
    jest.useRealTimers();
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
      limiter.updateFromResponse(
        {
          'retry-after': '10',
        },
        429,
      );

      const status = limiter.getStatus();
      expect(status.retryAfter).toBe(10);
      expect(status.blockedUntil).toBe(START + 10000);
      expect(limiter.isBlocked()).toBe(true);
    });

    it('stays blocked until exactly blockedUntil', () => {
      limiter.updateFromResponse({ 'retry-after': '10' }, 429);

      jest.setSystemTime(START + 9999);
      expect(limiter.isBlocked()).toBe(true);
      expect(limiter.getStatus().retryAfter).toBe(1);

      jest.setSystemTime(START + 10000);
      expect(limiter.isBlocked()).toBe(false);
      expect(limiter.getStatus().retryAfter).toBeNull();
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
      limiter.updateFromResponse({}, 429);

      const status = limiter.getStatus();
      expect(status.blockedUntil).toBe(START + 60_000);
      expect(status.retryAfter).toBe(60);
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
      await expect(limiter.checkRateLimit()).resolves.toBeUndefined();
    });

    it('should enforce minimum delay between requests', async () => {
      // With test mode off and no rate limit data, minimum delay applies.
      // The first request has nothing to wait for.
      await limiter.checkRateLimit();

      let released = false;
      const second = limiter.checkRateLimit().then(() => {
        released = true;
      });

      // The second waits the full minDelayMs (50ms): not released at 49ms...
      await jest.advanceTimersByTimeAsync(49);
      expect(released).toBe(false);

      // ...released at 50ms.
      await jest.advanceTimersByTimeAsync(1);
      await second;
      expect(released).toBe(true);
    });

    it('waits only the part of the minimum delay that has not passed', async () => {
      const sleepSpy = jest.spyOn(sleepModule, 'sleep');
      try {
        await limiter.checkRateLimit();
        expect(sleepSpy).not.toHaveBeenCalled();

        jest.setSystemTime(START + 20);
        const second = limiter.checkRateLimit();
        await jest.advanceTimersByTimeAsync(30);
        await second;
        expect(sleepSpy).toHaveBeenCalledTimes(1);
        expect(sleepSpy).toHaveBeenCalledWith(30);

        // A request 50ms or more after the last one does not wait at all.
        jest.setSystemTime(Date.now() + 50);
        await limiter.checkRateLimit();
        expect(sleepSpy).toHaveBeenCalledTimes(1);
      } finally {
        sleepSpy.mockRestore();
      }
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

    it('should correctly classify exact boundary status codes', () => {
      expect(RateLimiter.getTokenCost(199)).toBe(2); // below 2xx
      expect(RateLimiter.getTokenCost(200)).toBe(2); // 2xx start
      expect(RateLimiter.getTokenCost(299)).toBe(2); // 2xx end
      expect(RateLimiter.getTokenCost(300)).toBe(1); // 3xx start
      expect(RateLimiter.getTokenCost(399)).toBe(1); // 3xx end
      expect(RateLimiter.getTokenCost(400)).toBe(5); // 4xx start
      expect(RateLimiter.getTokenCost(499)).toBe(5); // 4xx end
      expect(RateLimiter.getTokenCost(500)).toBe(0); // 5xx start
      expect(RateLimiter.getTokenCost(599)).toBe(0); // 5xx end
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

      // The clock has not moved, so the wait is the whole Retry-After.
      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(10000);

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

      // min(reset 10s, 5s cap)
      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(5000);
    });

    it('waits the reset time when it is below the 5s cap and the limit is low', async () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '10',
          'x-esi-error-limit-reset': '3',
        },
        404,
      );

      await limiter.checkRateLimit();

      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(3000);
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

      // ratio 0.1 against the 0.2 threshold: (1 - 0.1 / 0.2) * 1000
      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(500);
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

      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(5000);
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

      // ratio 1/15 against the 0.2 threshold: ceil((1 - (1/15) / 0.2) * 1000)
      expect(sleepSpy).toHaveBeenCalledTimes(1);
      expect(sleepSpy).toHaveBeenCalledWith(667);
    });
  });

  describe('checkRateLimit blocked retry budget exhaustion', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should throw EsiError when block is re-extended past retry budget', async () => {
      limiter.updateFromResponse({ 'retry-after': '5' }, 429);

      sleepSpy.mockImplementation(async () => {
        jest.setSystemTime(Date.now() + 100);
        limiter.updateFromResponse({ 'retry-after': '5' }, 429);
      });

      await expect(limiter.checkRateLimit()).rejects.toThrow(/still blocked/);
      // Ten waits (the retry budget), each for the whole 5s block that the
      // concurrent response has just re-extended.
      expect(sleepSpy).toHaveBeenCalledTimes(10);
      expect(sleepSpy.mock.calls.map(([ms]) => ms)).toEqual(
        Array(10).fill(5000),
      );
    });
  });

  describe('isBlocked with fallback bucket', () => {
    it('should return true when fallback bucket is blocked', () => {
      limiter.updateFromResponse({ 'retry-after': '30' }, 429);
      expect(limiter.isBlocked()).toBe(true);
    });
  });

  describe('getStatus with user buckets', () => {
    it('should check user bucket groups in getStatus', () => {
      const userLimiter = new RateLimiter({
        userKeyExtractor: (headers) => headers['authorization'] ?? 'anon',
      });
      userLimiter.setTestMode(false);

      userLimiter.updateFromResponse(
        {
          'x-ratelimit-remaining': '3',
          'x-ratelimit-limit': '15',
          'x-ratelimit-used': '12',
          'x-ratelimit-group': 'char-notification',
        },
        200,
        'characters/{characterId}/notifications',
        'GET',
        { authorization: 'Bearer user-a' },
      );

      const status = userLimiter.getStatus();
      expect(status.remaining).toBe(3);
      expect(status.group).toBe('char-notification');

      userLimiter.setTestMode(true);
    });
  });

  describe('cleanup stale users', () => {
    let sleepSpy: jest.SpyInstance;

    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
      sleepSpy.mockRestore();
    });

    it('should skip cleanup when interval has not elapsed', async () => {
      const userLimiter = new RateLimiter({
        userKeyExtractor: (headers) => headers['authorization'] ?? 'anon',
      });

      const lastCleanup = () =>
        (userLimiter as unknown as { lastCleanup: number }).lastCleanup;
      jest.setSystemTime(1_000_000);

      await userLimiter.checkRateLimit(undefined, undefined, {
        authorization: 'Bearer user-a',
      });
      expect(lastCleanup()).toBe(1_000_000);

      // One millisecond short of the 60s cleanup interval.
      jest.setSystemTime(1_000_000 + 59_999);
      await userLimiter.checkRateLimit(undefined, undefined, {
        authorization: 'Bearer user-a',
      });
      // The interval has not elapsed, so cleanup did not run again.
      expect(lastCleanup()).toBe(1_000_000);

      // At exactly the interval it runs.
      jest.setSystemTime(1_000_000 + 60_000);
      await userLimiter.checkRateLimit(undefined, undefined, {
        authorization: 'Bearer user-a',
      });
      expect(lastCleanup()).toBe(1_060_000);

      userLimiter.setTestMode(true);
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

  describe('endpoint overrides', () => {
    it('should use endpoint override instead of generated group spec', async () => {
      const overrideLimiter = new RateLimiter({
        endpointOverrides: {
          'GET:markets/{region_id}/history': {
            maxTokens: 5,
            windowSizeMs: 1000,
          },
        },
      });

      await overrideLimiter.checkRateLimit(
        'markets/{region_id}/history',
        'GET',
      );

      const status = overrideLimiter.getGroupStatus(
        'endpoint:GET:markets/{region_id}/history',
      );
      expect(status).toBeDefined();
      expect(status!.limit).toBe(5);
      expect(status!.windowSizeMs).toBe(1000);
      overrideLimiter.setTestMode(true);
    });

    it('should not affect endpoints without overrides', async () => {
      const overrideLimiter = new RateLimiter({
        endpointOverrides: {
          'GET:markets/{region_id}/history': {
            maxTokens: 5,
            windowSizeMs: 1000,
          },
        },
      });

      await overrideLimiter.checkRateLimit(
        'characters/{character_id}/assets',
        'GET',
      );

      const overrideStatus = overrideLimiter.getGroupStatus(
        'endpoint:GET:characters/{character_id}/assets',
      );
      expect(overrideStatus).toBeUndefined();

      const groupStatus = overrideLimiter.getGroupStatus('char-asset');
      expect(groupStatus).toBeDefined();
      overrideLimiter.setTestMode(true);
    });

    it('should create separate buckets for overridden endpoints', async () => {
      const overrideLimiter = new RateLimiter({
        endpointOverrides: {
          'GET:markets/{region_id}/history': {
            maxTokens: 5,
            windowSizeMs: 1000,
          },
          'GET:markets/{region_id}/orders': {
            maxTokens: 100,
            windowSizeMs: 900000,
          },
        },
      });

      await overrideLimiter.checkRateLimit(
        'markets/{region_id}/history',
        'GET',
      );
      // The second request waits out the 50ms minimum delay.
      const second = overrideLimiter.checkRateLimit(
        'markets/{region_id}/orders',
        'GET',
      );
      await jest.advanceTimersByTimeAsync(50);
      await second;

      const historyStatus = overrideLimiter.getGroupStatus(
        'endpoint:GET:markets/{region_id}/history',
      );
      const ordersStatus = overrideLimiter.getGroupStatus(
        'endpoint:GET:markets/{region_id}/orders',
      );

      expect(historyStatus).toBeDefined();
      expect(ordersStatus).toBeDefined();
      expect(historyStatus!.limit).toBe(5);
      expect(ordersStatus!.limit).toBe(100);
      overrideLimiter.setTestMode(true);
    });
  });
});
