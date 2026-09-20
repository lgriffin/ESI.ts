import {
  MAIL_CHARACTER_ID,
  MAIL_ID,
  mailFixtures,
  mailPaths,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a character with a specific mail', function () {
  queueResponse({
    match: mailPaths.mail(MAIL_CHARACTER_ID, MAIL_ID),
    body: mailFixtures.message(),
  });
});
