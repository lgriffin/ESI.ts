import { createSeamClient } from '../../support/transport';
import { When } from '../../support/steps';

When('a client is created with a tenant holding a line break', function () {
  try {
    createSeamClient({ tenant: 'singularity\r\nX-Injected: 1' });
  } catch (err) {
    this.error = err;
  }
});
