import { storeOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('another holder of the store clears the store', function () {
  storeOf(this).receive({ kind: 'clear' });
});
