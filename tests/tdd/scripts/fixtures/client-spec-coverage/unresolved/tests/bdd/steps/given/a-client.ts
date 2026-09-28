import { GammaClient } from '../../../../src/clients/GammaClient';
import { Given } from '../../support/steps';

Given('a client', function () {
  this.gamma = new GammaClient();
});
