import { MAIL_CHARACTER_ID, MAIL_ID, mailPaths } from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unread mail', function () {
  queueResponse({
    match: mailPaths.mail(MAIL_CHARACTER_ID, MAIL_ID),
    status: 204,
  });
});
