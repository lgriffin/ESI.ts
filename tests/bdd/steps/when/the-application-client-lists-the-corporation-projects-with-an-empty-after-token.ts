import { projectsClient } from '../../support/custom-endpoints';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the application client lists the corporation projects with an empty after token',
  async function () {
    await captureOutcome(this, () =>
      projectsClient(this).listProjects(98000001, { after: '' }),
    );
  },
);
