import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the client requests Paragon Hub data', async function () {
  await captureOutcome(this, () => this.client.paragonHub.getPublicListings());
});
