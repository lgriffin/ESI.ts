import { buildCustomClient } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a custom client built with the {string} client',
  function (name: string) {
    buildCustomClient(this, [name]);
  },
);
