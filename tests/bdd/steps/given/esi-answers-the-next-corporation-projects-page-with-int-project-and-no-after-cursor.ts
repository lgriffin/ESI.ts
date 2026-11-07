import { PROJECTS_PATH } from '../../support/paging';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the next corporation projects page with {int} project and no after cursor',
  function (count: number) {
    queueResponse({
      match: PROJECTS_PATH,
      body: Array.from({ length: count }, (_, i) => ({ id: `project-2-${i}` })),
    });
  },
);
