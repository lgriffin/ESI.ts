import { queueResponse } from '../../support/transport';
import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status without its player count to the next {int} requests',
  function (times: number) {
    const body: Record<string, unknown> = { ...serverStatus() };
    delete body.players;
    queueResponse({ match: STATUS_PATH, body, times });
  },
);
