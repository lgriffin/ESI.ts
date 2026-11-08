import { storeOf } from '../../support/cache-components';
import { When } from '../../support/steps';

When(
  'another holder of the store invalidates the path {string}',
  function (path: string) {
    storeOf(this).receive({ kind: 'path', path });
  },
);
