import { EsiError } from '../../../../src/core/util/error';
import { limiterOf } from '../../support/rate-limit';
import { Then } from '../../support/steps';

Then(
  'the rate limiter shall report the {string} group blocked for {int} seconds',
  function (group: string, seconds: number) {
    expect(this.error).toBeInstanceOf(EsiError);
    expect((this.error as EsiError).statusCode).toBe(429);
    const limiter = limiterOf(this);
    expect(limiter.isBlocked(group)).toBe(true);
    expect(limiter.isBlocked()).toBe(true);
    const status = limiter.getStatus();
    expect(status.group).toBe(group);
    // Whole seconds, rounded up: the block began a moment ago.
    expect(status.retryAfter).toBe(seconds);
    const blockedFor = limiter.getGroupStatus(group)!.blockedUntil - Date.now();
    expect(blockedFor).toBeGreaterThan((seconds - 1) * 1000);
    expect(blockedFor).toBeLessThanOrEqual(seconds * 1000);
  },
);
