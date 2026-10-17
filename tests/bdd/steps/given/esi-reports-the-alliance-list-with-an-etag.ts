import { ALLIANCES_PATH } from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the alliance list with an ETag', function () {
  queueResponse({
    match: ALLIANCES_PATH,
    body: [99_000_001, 99_000_002],
    headers: { etag: '"alliances-v1"' },
  });
});
