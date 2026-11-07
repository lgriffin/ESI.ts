import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the next server status request with 304, the ETag {string} and the request id {string}',
  function (etag: string, requestId: string) {
    queueResponse({
      match: STATUS_PATH,
      status: 304,
      headers: { etag: `"${etag}"`, 'x-esi-request-id': requestId },
    });
  },
);
