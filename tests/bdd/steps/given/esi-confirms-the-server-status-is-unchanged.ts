import { STATUS_PATH } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI confirms the server status is unchanged', function () {
  queueResponse({
    match: STATUS_PATH,
    status: 304,
    headers: { etag: '"status-v1"' },
  });
});
