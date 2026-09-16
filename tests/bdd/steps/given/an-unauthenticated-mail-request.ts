import { MAIL_CHARACTER_ID, mailHeadersMatch } from '../../support/mail';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unauthenticated mail request', function () {
  queueError(403, 'token not valid for scope(s): esi-mail.read_mail.v1', {
    match: mailHeadersMatch(MAIL_CHARACTER_ID),
  });
});
