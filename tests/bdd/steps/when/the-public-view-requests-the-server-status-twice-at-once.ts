import { captureOutcome } from '../../support/outcome';
import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the public view requests the server status twice at once',
  async function () {
    const status = runtimeOf(this).public.status;
    await captureOutcome(this, () => Promise.all([status.get(), status.get()]));
  },
);
