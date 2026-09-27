import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the server status with an ETag', function () {
  // The cache stores a body only with its ETag; the spec TTL (30 s) keeps it fresh.
  queueResponse({
    match: STATUS_PATH,
    body: serverStatus(),
    headers: { etag: '"status-v1"' },
  });
});
