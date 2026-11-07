import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client that does not validate responses', function () {
  this.client = createSeamClient({ validateResponse: false });
});
