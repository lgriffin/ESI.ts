import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client that validates requests', function () {
  this.client = createSeamClient({ validateRequest: true });
});
