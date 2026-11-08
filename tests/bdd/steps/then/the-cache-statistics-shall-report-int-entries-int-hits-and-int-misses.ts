import { statsOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache statistics shall report {int} entries, {int} hits and {int} misses',
  function (entries: number, hits: number, misses: number) {
    const stats = statsOf(this);
    expect([stats.totalEntries, stats.hits, stats.misses]).toEqual([
      entries,
      hits,
      misses,
    ]);
  },
);
