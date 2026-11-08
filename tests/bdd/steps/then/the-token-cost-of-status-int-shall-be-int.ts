import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { Then } from '../../support/steps';

Then(
  'the token cost of status {int} shall be {int}',
  function (status: number, cost: number) {
    expect(RateLimiter.getTokenCost(status)).toBe(cost);
  },
);
