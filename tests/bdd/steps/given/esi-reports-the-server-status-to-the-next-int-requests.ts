import { queueResponse } from '../../support/transport';
import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status to the next {int} requests',
  function (times: number) {
    queueResponse({ match: STATUS_PATH, body: serverStatus(), times });
  },
);
