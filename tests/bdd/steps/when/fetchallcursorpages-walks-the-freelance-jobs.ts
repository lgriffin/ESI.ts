import { fetchAllCursorPages } from '../../../../src/core/endpoints/createClient';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

interface JobsPage {
  freelance_jobs: { id: string }[];
  cursor: { before?: string; after?: string };
}

When('fetchAllCursorPages walks the freelance jobs', async function () {
  await captureOutcome(this, () =>
    fetchAllCursorPages(
      (before, after) =>
        this.client.freelanceJobs.getFreelanceJobs(
          before,
          after,
        ) as unknown as Promise<JobsPage>,
      (page) => page.freelance_jobs,
      (page) => page.cursor,
    ),
  );
});
