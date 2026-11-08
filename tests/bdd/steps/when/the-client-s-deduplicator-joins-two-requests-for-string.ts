import { apiClientOf } from '../../support/pipeline-parts';
import { When } from '../../support/steps';

When(
  "the client's deduplicator joins two requests for {string}",
  function (key: string) {
    const deduplicator = apiClientOf(this).getDeduplicator();
    if (!deduplicator) throw new Error('The client built no deduplicator');
    const pending = (): Promise<never> => new Promise<never>(() => {});
    void deduplicator.dedupe(key, pending);
    void deduplicator.dedupe(key, pending);
  },
);
