import { surfaceOf } from '../../support/client-construction';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the built client reads the server status', async function () {
  await captureOutcome(this, () => surfaceOf(this).getStatus());
});
