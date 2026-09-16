import {
  CHAINED_KILLMAIL,
  PILOT_CHARACTER_ID,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a character with recent killmails for chaining', function () {
  queueResponse({
    match: killmailPaths.characterRecent(PILOT_CHARACTER_ID),
    body: killmailFixtures.chainSummaries(),
  });
  queueResponse({
    match: killmailPaths.detail(CHAINED_KILLMAIL),
    body: killmailFixtures.chainedDetail(),
  });
});
