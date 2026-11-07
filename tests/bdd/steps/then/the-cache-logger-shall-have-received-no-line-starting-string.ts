import { cacheLoggerOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache logger shall have received no line starting {string}',
  function (prefix: string) {
    const lines = cacheLoggerOf(this).lines.map((l) => l.message);
    expect(lines.filter((m) => m.startsWith(prefix))).toEqual([]);
  },
);
