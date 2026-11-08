import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with HTTP 503, then reports it, then answers HTTP 503, then reports it',
  function () {
    for (let i = 0; i < 2; i++) {
      queueResponse({ match: STATUS_PATH, status: 503, body: {} });
      queueResponse({ match: STATUS_PATH, body: serverStatus() });
    }
  },
);
