import {
  MAIL_CHARACTER_ID,
  UNKNOWN_MAIL_ID,
  mailPaths,
} from '../../support/mail';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a mail ID that does not exist', function () {
  queueError(404, 'Mail not found', {
    match: mailPaths.mail(MAIL_CHARACTER_ID, UNKNOWN_MAIL_ID),
  });
});
