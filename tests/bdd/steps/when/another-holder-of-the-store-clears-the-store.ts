import { storeOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When('another holder of the store clears the store', function () {
  const store = storeOf(this);
  // The other holder empties the shared store, then its event arrives here.
  store.clear();
  store.receive({ kind: 'clear' });
});
