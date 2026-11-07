import { PROJECT_LIST_PATH, project } from '../../support/custom-endpoints';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the corporation projects with the single project {string}',
  function (id: string) {
    queueResponse({ match: PROJECT_LIST_PATH, body: project(id) });
  },
);
