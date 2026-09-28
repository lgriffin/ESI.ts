import { AlphaClient } from '../../../../src/clients/AlphaClient';
import { BetaClient } from '../../../../src/clients/BetaClient';
import { Given } from '../../support/steps';

Given('two clients', function () {
  this.alpha = AlphaClient.create();
  this.beta = new BetaClient();
});
