import { customClientOf } from '../../support/custom-client';
import { Then } from '../../support/steps';

Then(
  "the custom client's cache statistics shall report {int} entry and {int} hit",
  function (entries: number, hits: number) {
    const custom = customClientOf(this);
    expect(custom.getCacheStats()).toMatchObject({
      totalEntries: entries,
      hits,
    });
    expect(custom.diagnostics.getCacheStats()).toEqual(custom.getCacheStats());
  },
);
