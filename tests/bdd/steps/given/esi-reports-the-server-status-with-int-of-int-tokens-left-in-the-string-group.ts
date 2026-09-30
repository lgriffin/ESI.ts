import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status with {int} of {int} tokens left in the {string} group',
  function (remaining: number, limit: number, group: string) {
    queueResponse({
      match: STATUS_PATH,
      body: serverStatus(),
      headers: {
        'x-ratelimit-group': group,
        'x-ratelimit-remaining': String(remaining),
        'x-ratelimit-limit': String(limit),
        'x-ratelimit-used': String(limit - remaining),
      },
    });
  },
);
