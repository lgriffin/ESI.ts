import type { RequestDeduplicator } from '../../../../src/core/RequestDeduplicator';
import { Given } from '../../support/steps';

Given(
  'a read of {string} is in flight through the deduplicator',
  function (url: string) {
    const deduplicator = this.values.deduplicator as RequestDeduplicator;
    this.values.readKey = url;
    // Never settles: the read stays in flight for the whole scenario.
    void deduplicator.dedupe(url, () => {
      this.values.sentReads += 1;
      return new Promise<never>(() => {});
    });
  },
);
