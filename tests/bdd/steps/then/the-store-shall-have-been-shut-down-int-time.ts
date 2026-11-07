import { storeOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the store shall have been shut down {int} time',
  function (count: number) {
    expect(storeOf(this).shutdowns).toBe(count);
  },
);
