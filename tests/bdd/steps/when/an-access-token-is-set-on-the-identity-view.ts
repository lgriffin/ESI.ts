import { viewOf } from '../../support/identity-views';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('an access token is set on the identity view', async function () {
  await captureOutcome(this, () => {
    viewOf(this).setAccessToken('another-token');
    return Promise.resolve();
  });
});
