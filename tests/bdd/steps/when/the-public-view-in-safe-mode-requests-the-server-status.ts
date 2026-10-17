import { captureOutcome } from '../../support/outcome';
import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the public view in safe mode requests the server status',
  async function () {
    await captureOutcome(this, () =>
      runtimeOf(this).withSafeMode().public.status.get(),
    );
  },
);
