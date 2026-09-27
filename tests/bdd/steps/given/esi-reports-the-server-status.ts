import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the server status', function () {
  queueResponse({ match: STATUS_PATH, body: serverStatus() });
});
