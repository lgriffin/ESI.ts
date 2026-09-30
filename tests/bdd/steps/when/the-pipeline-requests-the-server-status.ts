import { statusClientOf } from '../../support/rate-limit';
import { When } from '../../support/steps';

When('the pipeline requests the server status', async function () {
  try {
    this.result = await statusClientOf(this).getStatus();
  } catch (err) {
    this.error = err;
  }
});
