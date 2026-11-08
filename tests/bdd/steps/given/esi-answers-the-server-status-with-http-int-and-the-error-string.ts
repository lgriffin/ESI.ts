import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with HTTP {int} and the error {string}',
  function (status: number, error: string) {
    queueResponse({ match: STATUS_PATH, status, body: { error } });
  },
);
