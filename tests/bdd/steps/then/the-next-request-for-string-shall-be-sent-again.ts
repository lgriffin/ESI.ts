import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the next request for {string} shall be sent again',
  function (key: string) {
    void apiClientOf(this)
      .getDeduplicator()
      ?.dedupe(key, this.values.send as () => Promise<never>);
    expect(this.values.sent).toBe(2);
  },
);
