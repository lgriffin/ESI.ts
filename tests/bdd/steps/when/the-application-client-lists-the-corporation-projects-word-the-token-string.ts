import { projectsClient } from '../../support/custom-endpoints';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the application client lists the corporation projects {word} the token {string}',
  async function (direction: string, token: string) {
    await captureOutcome(this, () =>
      projectsClient(this).listProjects(98000001, { [direction]: token }),
    );
  },
);
