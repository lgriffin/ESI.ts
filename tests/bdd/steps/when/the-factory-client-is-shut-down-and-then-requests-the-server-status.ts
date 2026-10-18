import { factoryClientOf } from '../../support/factory-client';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the factory client is shut down and then requests the server status',
  async function () {
    factoryClientOf(this).shutdown();
    await captureOutcome(this, () => factoryClientOf(this).getStatus());
  },
);
