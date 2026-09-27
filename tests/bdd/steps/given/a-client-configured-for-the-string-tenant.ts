import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client configured for the {string} tenant', function (tenant: string) {
  this.client = createSeamClient({ tenant });
});
