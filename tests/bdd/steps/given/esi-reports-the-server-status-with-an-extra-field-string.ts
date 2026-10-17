import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status with an extra field {string}',
  function (field: string) {
    const body = { ...serverStatus(), [field]: 'tranquility-1' };
    this.values.sentBody = body;
    queueResponse({ match: STATUS_PATH, body });
  },
);
