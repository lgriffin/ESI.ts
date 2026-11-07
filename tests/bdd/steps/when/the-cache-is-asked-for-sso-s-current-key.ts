import { askForKey, CURRENT_KID } from '../../support/token-verification';
import { When } from '../../support/steps';

When("the cache is asked for SSO's current key", async function () {
  await askForKey(this, CURRENT_KID);
});
