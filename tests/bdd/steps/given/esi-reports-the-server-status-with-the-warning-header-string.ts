import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status with the Warning header {string}',
  function (warning: string) {
    queueResponse({
      match: STATUS_PATH,
      headers: { warning },
      body: serverStatus(),
    });
  },
);
