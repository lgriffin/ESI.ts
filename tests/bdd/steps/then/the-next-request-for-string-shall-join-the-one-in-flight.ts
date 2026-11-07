import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the next request for {string} shall join the one in flight',
  function (key: string) {
    void apiClientOf(this)
      .getDeduplicator()
      ?.dedupe(key, this.values.send as () => Promise<never>);
    expect(this.values.sent).toBe(1);
  },
);
