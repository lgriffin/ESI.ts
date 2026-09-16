import { MAIL_CHARACTER_ID, mailFixtures, mailPaths } from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character subscribed to mailing lists', function () {
  queueResponse({
    match: mailPaths.lists(MAIL_CHARACTER_ID),
    body: mailFixtures.mailingLists(),
  });
});
