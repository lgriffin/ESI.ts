import { Then } from '../../support/steps';

Then(
  "the result's metadata shall report an answer from the cache",
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result.meta).toMatchObject({
      fromCache: true,
      cacheHitType: 'spec-ttl',
      etag: '"status-v1"',
    });
  },
);
