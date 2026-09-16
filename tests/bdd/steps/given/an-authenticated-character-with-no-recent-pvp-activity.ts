import { QUIET_CHARACTER_ID, killmailPaths } from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with no recent PvP activity', function () {
  queueResponse({
    match: killmailPaths.characterRecent(QUIET_CHARACTER_ID),
    body: [],
  });
});
