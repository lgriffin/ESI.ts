import { CLONE_CHARACTER_ID, clonePaths } from '../../support/clones';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid access token for clones', function () {
  // 403 is not retryable, so ESI answers exactly once.
  queueError(403, 'token is expired', {
    match: clonePaths.clones(CLONE_CHARACTER_ID),
  });
});
