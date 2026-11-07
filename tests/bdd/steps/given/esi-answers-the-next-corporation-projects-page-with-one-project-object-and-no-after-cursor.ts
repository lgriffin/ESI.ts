import { PROJECTS_PATH } from '../../support/paging';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the next corporation projects page with one project object and no after cursor',
  function () {
    queueResponse({ match: PROJECTS_PATH, body: { id: 'project-object' } });
  },
);
