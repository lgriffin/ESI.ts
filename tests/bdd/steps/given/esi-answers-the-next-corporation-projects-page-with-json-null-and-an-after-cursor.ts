import { PROJECTS_PATH } from '../../support/paging';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the next corporation projects page with JSON null and an after cursor',
  function () {
    queueResponse({
      match: PROJECTS_PATH,
      headers: {
        'content-type': 'application/json',
        'x-cursor-after': 'cursor-2',
      },
      body: 'null',
    });
  },
);
