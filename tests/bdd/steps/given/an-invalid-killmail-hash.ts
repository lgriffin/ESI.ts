import { MISMATCHED_KILLMAIL, killmailPaths } from '../../support/killmails';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid killmail hash', function () {
  queueError(404, 'Killmail not found', {
    match: killmailPaths.detail(MISMATCHED_KILLMAIL),
  });
});
