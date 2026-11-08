import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the server status with no answer in time', function () {
  // Longer than the scenario client's 50 ms timeout.
  queueResponse({ match: STATUS_PATH, body: serverStatus(), delayMs: 500 });
});
