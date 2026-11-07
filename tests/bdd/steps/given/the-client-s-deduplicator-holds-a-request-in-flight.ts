import { DEDUPE_KEY, surfaceOf } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given("the client's deduplicator holds a request in flight", function () {
  const deduplicator = surfaceOf(this).apiClient().getDeduplicator();
  if (!deduplicator) throw new Error('The client has no deduplicator');
  this.values.dedupeSent = 0;
  this.values.dedupeSend = (): Promise<never> => {
    this.values.dedupeSent += 1;
    return new Promise<never>(() => {});
  };
  void deduplicator.dedupe(DEDUPE_KEY, this.values.dedupeSend);
});
