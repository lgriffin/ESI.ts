import { customClientOf } from '../../support/custom-client';
import { When } from '../../support/steps';

When('the custom client requests the server status twice', async function () {
  const status = customClientOf(this).status!;
  await status.getStatus();
  this.result = await status.getStatus();
});
