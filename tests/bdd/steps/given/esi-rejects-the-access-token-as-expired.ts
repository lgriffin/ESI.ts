import {
  ACCESS_LIST_OWNER_ID,
  EXPIRED_ACCESS_TOKEN,
  MIXED_ACCESS_LIST_ID,
  accessListPaths,
} from '../../support/access-lists';
import { createSeamClient, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI rejects the access token as expired', function () {
  // A token ESI no longer accepts. A client with no token at all never
  // reaches ESI: the pipeline throws a plain NO_AUTH_TOKEN Error before
  // sending, so the refusal this Rule describes is ESI's 401.
  this.client = createSeamClient({ accessToken: EXPIRED_ACCESS_TOKEN });
  queueError(401, 'token is expired', {
    match: accessListPaths.list(ACCESS_LIST_OWNER_ID, MIXED_ACCESS_LIST_ID),
  });
});
