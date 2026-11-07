import { EsiClientBuilder } from '../../../../src/EsiClientBuilder';
import { When } from '../../support/steps';

When('an EsiClientBuilder with no domain builds a client', function () {
  try {
    this.result = new EsiClientBuilder().build();
  } catch (error: unknown) {
    this.error = error;
  }
});
