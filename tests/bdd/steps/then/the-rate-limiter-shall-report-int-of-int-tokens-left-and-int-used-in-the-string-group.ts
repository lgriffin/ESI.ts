import { limiterOf } from '../../support/rate-limit';
import { Then } from '../../support/steps';

Then(
  'the rate limiter shall report {int} of {int} tokens left and {int} used in the {string} group',
  function (remaining: number, limit: number, used: number, group: string) {
    const limiter = limiterOf(this);
    const status = limiter.getGroupStatus(group);
    expect(status).toMatchObject({ group, remaining, limit, used });
    expect(limiter.getAllGroupStatuses().get(group)).toEqual(status);
    // The group is the only one ESI has reported on, so it is the worst.
    expect(limiter.getStatus()).toMatchObject({
      group,
      remaining,
      limit,
      used,
      retryAfter: null,
    });
    expect(limiter.getGroupStatus('no-such-group')).toBeUndefined();
  },
);
