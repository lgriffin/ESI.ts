import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with HTTP {int} and an error reason of {int} characters',
  function (status: number, length: number) {
    queueResponse({
      match: STATUS_PATH,
      status,
      body: { error: 'r'.repeat(length) },
    });
  },
);
