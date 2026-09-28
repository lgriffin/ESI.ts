import { Given } from '../../support/steps';
import { openDescendingProvider } from '../../support/sde';

Given(
  'a static data provider whose categories and types were loaded in descending ID order',
  function () {
    openDescendingProvider(this);
  },
);
