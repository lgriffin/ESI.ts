import { EsiClientBuilder } from '../../../../src/EsiClientBuilder';
import { When } from '../../support/steps';

When('a custom client is built with no clients', function () {
  try {
    new EsiClientBuilder().withClientId('bdd-custom-client').build();
  } catch (err) {
    this.error = err;
  }
});
