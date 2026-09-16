import {
  CORPORATION_ID,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated corporation member', function () {
  queueResponse({
    match: killmailPaths.corporationRecent(CORPORATION_ID),
    body: killmailFixtures.corporationSummaries(),
  });
});
