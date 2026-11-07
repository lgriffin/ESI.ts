import { PROJECT_LIST_PATH } from '../../support/custom-endpoints';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the corporation projects with JSON null', function () {
  queueResponse({
    match: PROJECT_LIST_PATH,
    headers: { 'content-type': 'application/json' },
    body: 'null',
  });
});
