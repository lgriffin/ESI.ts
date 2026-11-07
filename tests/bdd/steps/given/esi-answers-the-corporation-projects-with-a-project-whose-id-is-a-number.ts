import { PROJECT_LIST_PATH } from '../../support/custom-endpoints';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the corporation projects with a project whose id is a number',
  function () {
    queueResponse({ match: PROJECT_LIST_PATH, body: [{ id: 7 }] });
  },
);
