import {
  REPORT_KILLMAIL,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid killmail ID and hash', function () {
  queueResponse({
    match: killmailPaths.detail(REPORT_KILLMAIL),
    body: killmailFixtures.report(),
  });
});
