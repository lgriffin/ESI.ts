import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the server status with JSON null', function () {
  queueResponse({
    match: STATUS_PATH,
    headers: { 'content-type': 'application/json' },
    body: 'null',
  });
});
