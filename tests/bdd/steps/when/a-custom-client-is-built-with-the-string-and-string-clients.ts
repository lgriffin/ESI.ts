import { buildCustomClient } from '../../support/custom-client';
import { When } from '../../support/steps';

When(
  'a custom client is built with the {string} and {string} clients',
  function (first: string, second: string) {
    buildCustomClient(this, [first, second]);
  },
);
