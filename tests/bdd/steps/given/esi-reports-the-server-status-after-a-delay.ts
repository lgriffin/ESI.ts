import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the server status after a delay', function () {
  // Long enough for the second call to arrive while the first is in flight.
  queueResponse({ match: STATUS_PATH, body: serverStatus(), delayMs: 20 });
});
