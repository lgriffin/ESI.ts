import type { RequestDeduplicator } from '../../../../src/core/RequestDeduplicator';
import { When } from '../../support/steps';

When('the same read is started through the deduplicator', function () {
  const deduplicator = this.values.deduplicator as RequestDeduplicator;
  void deduplicator.dedupe(this.values.readKey as string, () => {
    this.values.sentReads += 1;
    return new Promise<never>(() => {});
  });
});
