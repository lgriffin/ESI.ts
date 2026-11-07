import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI reports the server status with the ETag {string} and the header {string} set to {string}',
  function (etag: string, header: string, value: string) {
    queueResponse({
      match: STATUS_PATH,
      body: serverStatus(),
      headers: { etag: `"${etag}"`, [header]: value },
    });
  },
);
