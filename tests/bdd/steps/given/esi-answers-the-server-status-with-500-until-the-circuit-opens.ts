import { STATUS_PATH } from '../../support/request-headers';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with 500 until the circuit opens',
  function () {
    // A 500 is not retried (0051-resilience), so each call is one failure.
    queueError(500, 'internal error', { match: STATUS_PATH, times: 2 });
  },
);
