import { buildPublicCustomClient } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a public custom client built with the {string} client from a builder holding an access token',
  function (name: string) {
    buildPublicCustomClient(this, [name], { withToken: true });
  },
);
