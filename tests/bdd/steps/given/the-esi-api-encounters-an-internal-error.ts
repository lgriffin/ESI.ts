import { STATUS_PATH } from '../../support/status';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI API encounters an internal error', function () {
  queueError(500, 'Internal server error', { match: STATUS_PATH });
});
