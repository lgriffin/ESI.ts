import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI lists the freelance jobs {string}, {string} and then no jobs, each page with an after token',
  function (first: string, second: string) {
    const pages = [[first], [second], []];
    pages.forEach((ids, i) => {
      queueResponse({
        match: '/freelance-jobs',
        body: {
          freelance_jobs: ids.map((id) => ({ id })),
          cursor: { after: `page-${i + 2}` },
        },
      });
    });
  },
);
