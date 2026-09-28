import { Given } from '../../support/steps';
import { openExtendedProvider } from '../../support/sde';

Given(
  'a static data provider with the extended universe data set',
  function () {
    openExtendedProvider(this);
  },
);
