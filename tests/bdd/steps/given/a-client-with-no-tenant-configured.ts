import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client with no tenant configured', function () {
  this.client = createSeamClient();
});
