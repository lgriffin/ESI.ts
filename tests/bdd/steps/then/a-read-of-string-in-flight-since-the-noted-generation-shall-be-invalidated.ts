import { cacheOf } from '../../support/cache-components';
import { invalidatedSince } from '../../../../src/core/cache/writeLog';
import { Then } from '../../support/steps';

Then(
  'a read of {string} in flight since the noted generation shall be invalidated',
  function (key: string) {
    expect(
      invalidatedSince(cacheOf(this), this.values.generation as number, key),
    ).toBe(true);
  },
);
