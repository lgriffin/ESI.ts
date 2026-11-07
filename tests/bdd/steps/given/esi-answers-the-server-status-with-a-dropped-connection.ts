import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the server status with a dropped connection', function () {
  queueResponse({
    match: STATUS_PATH,
    fault: { kind: 'connection-error', code: 'ECONNRESET' },
  });
});
