import { factoryClientOf } from '../../support/factory-client';
import { Then } from '../../support/steps';

Then(
  "the factory client's cache statistics shall report {int} entry and {int} hit",
  function (entries: number, hits: number) {
    expect(this.error).toBeUndefined();
    expect(factoryClientOf(this).diagnostics.getCacheStats()).toMatchObject({
      totalEntries: entries,
      hits,
    });
  },
);
