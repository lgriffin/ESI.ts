import { STATUS_PATH } from '../../support/request-headers';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the server status with 404', function () {
  queueError(404, 'Not found', { match: STATUS_PATH });
});
