import { sharingClientOf } from '../../support/shared-cache-store';
import { When } from '../../support/steps';

When('the reader requests the server status', async function () {
  this.result = await sharingClientOf(this, 'reader').status.getStatus();
});
