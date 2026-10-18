import { publicCustomClientOf } from '../../support/custom-client';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the public custom client requests the server status', async function () {
  await captureOutcome(this, () =>
    publicCustomClientOf(this).status!.getStatus(),
  );
});
