import { DEDUPE_KEY, surfaceOf } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then(
  "the next request through the client's deduplicator shall be sent again",
  function () {
    void surfaceOf(this)
      .apiClient()
      .getDeduplicator()
      ?.dedupe(DEDUPE_KEY, this.values.dedupeSend as () => Promise<never>);
    expect(this.values.dedupeSent).toBe(2);
  },
);
