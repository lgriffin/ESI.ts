import { runtimeOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the runtime's cache statistics shall report {int} entry",
  function (entries: number) {
    expect(runtimeOf(this).getCacheStats()?.totalEntries).toBe(entries);
  },
);
