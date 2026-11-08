import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI lists the freelance job {string} with no after token',
  function (id: string) {
    queueResponse({
      match: '/freelance-jobs',
      body: { freelance_jobs: [{ id }], cursor: {} },
    });
  },
);
