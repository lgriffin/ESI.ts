import {
  PILOT_CHARACTER_ID,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with killmails', function () {
  queueResponse({
    match: killmailPaths.characterRecent(PILOT_CHARACTER_ID),
    body: killmailFixtures.characterSummaries(),
  });
});
