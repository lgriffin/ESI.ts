import { PILOT_CHARACTER_ID, killmailPaths } from '../../support/killmails';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unauthenticated killmail request', function () {
  // ESI refuses a token that lacks esi-killmails.read_killmails.v1 with 403.
  queueError(403, 'Token not valid for scope(s)', {
    match: killmailPaths.characterRecent(PILOT_CHARACTER_ID),
  });
});
