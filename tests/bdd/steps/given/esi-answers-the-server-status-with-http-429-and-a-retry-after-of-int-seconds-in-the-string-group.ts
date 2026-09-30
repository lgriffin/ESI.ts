import { STATUS_PATH } from '../../support/request-headers';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the server status with HTTP 429 and a Retry-After of {int} seconds in the {string} group',
  function (seconds: number, group: string) {
    queueError(429, 'Too many requests', {
      match: STATUS_PATH,
      headers: { 'x-ratelimit-group': group, 'retry-after': String(seconds) },
    });
  },
);
