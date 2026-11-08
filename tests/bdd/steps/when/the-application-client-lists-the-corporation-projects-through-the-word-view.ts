import { projectsClient } from '../../support/custom-endpoints';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the application client lists the corporation projects through the {word} view',
  async function (view: string) {
    const client = projectsClient(this);
    const viewed =
      view === 'safe' ? client.withSafeMode() : client.withMetadata();
    await captureOutcome(this, (): Promise<unknown> =>
      viewed.listProjects(98000001, { after: 'cursor-1' }),
    );
  },
);
