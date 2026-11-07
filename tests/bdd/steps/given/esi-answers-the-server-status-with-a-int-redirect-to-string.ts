import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with a {int} redirect to {string}',
  function (status: number, location: string) {
    queueResponse({ match: STATUS_PATH, status, headers: { location } });
  },
);
