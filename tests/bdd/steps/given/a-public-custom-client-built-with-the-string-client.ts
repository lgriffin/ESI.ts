import { buildPublicCustomClient } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a public custom client built with the {string} client',
  function (name: string) {
    buildPublicCustomClient(this, [name]);
  },
);
