import { captureOutcome } from '../../support/outcome';
import { customClientOf } from '../../support/custom-client';
import { When } from '../../support/steps';

When(
  'the custom client in metadata mode requests the server status',
  async function () {
    await captureOutcome(this, () =>
      customClientOf(this).withMetadata().status!.getStatus(),
    );
  },
);
