import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueError, queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with 503 once and then reports it',
  function () {
    queueError(503, 'service unavailable', { match: STATUS_PATH });
    queueResponse({ match: STATUS_PATH, body: serverStatus() });
  },
);
