import {
  MAIL_CHARACTER_ID,
  mailFixtures,
  mailHeadersMatch,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with mail', function () {
  queueResponse({
    match: mailHeadersMatch(MAIL_CHARACTER_ID),
    body: mailFixtures.inboxHeaders(),
  });
});
