import { widerStore } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'a store implementing every wider cache call but {word}',
  function (call: string) {
    this.values.store = widerStore(call);
  },
);
