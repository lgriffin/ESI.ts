import { DeltaClient } from '../../../../src/clients/DeltaClient';
import { Given } from '../../support/steps';

Given('a delta client', function () {
  this.delta = new DeltaClient();
});
