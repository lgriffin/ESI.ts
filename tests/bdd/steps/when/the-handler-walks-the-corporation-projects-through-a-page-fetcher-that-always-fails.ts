import type { ApiClient } from '../../../../src/core/ApiClient';
import { captureOutcome } from '../../support/outcome';
import { walkProjects } from '../../support/paging';
import { When } from '../../support/steps';

When(
  'the handler walks the corporation projects through a page fetcher that always fails',
  async function () {
    await captureOutcome(this, () =>
      walkProjects(this.values.cursorClient as ApiClient, 'cursor-1', () =>
        Promise.reject(new Error('socket closed')),
      ),
    );
  },
);
