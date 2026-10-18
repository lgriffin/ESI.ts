import { viewOf } from '../../support/identity-views';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the identity view requests the server status', async function () {
  await captureOutcome(this, () => viewOf(this).status.getStatus());
});
