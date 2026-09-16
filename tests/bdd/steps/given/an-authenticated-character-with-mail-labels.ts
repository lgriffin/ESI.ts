import { MAIL_CHARACTER_ID, mailFixtures, mailPaths } from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with mail labels', function () {
  queueResponse({
    match: mailPaths.labels(MAIL_CHARACTER_ID),
    body: mailFixtures.labels(),
  });
});
