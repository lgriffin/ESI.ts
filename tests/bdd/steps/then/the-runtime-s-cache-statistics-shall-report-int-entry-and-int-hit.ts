import { runtimeOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the runtime's cache statistics shall report {int} entry and {int} hit",
  function (entries: number, hits: number) {
    expect(runtimeOf(this).getCacheStats()).toMatchObject({
      totalEntries: entries,
      hits,
    });
  },
);
