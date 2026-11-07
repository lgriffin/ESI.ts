import type { ApiClient } from '../../../../src/core/ApiClient';
import { captureOutcome } from '../../support/outcome';
import { walkProjects } from '../../support/paging';
import { When } from '../../support/steps';

When(
  'the handler walks the corporation projects from the after cursor {string}',
  async function (after: string) {
    await captureOutcome(this, () =>
      walkProjects(this.values.cursorClient as ApiClient, after),
    );
  },
);
