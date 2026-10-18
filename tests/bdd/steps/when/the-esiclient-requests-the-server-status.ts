import { esiClientOf } from '../../support/identity-views';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the EsiClient requests the server status', async function () {
  await captureOutcome(this, () => esiClientOf(this).status.getStatus());
});
