import {
  MAIL_CHARACTER_ID,
  SENT_MAIL_ID,
  mailHeadersMatch,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character for sending mail', function () {
  queueResponse({
    match: mailHeadersMatch(MAIL_CHARACTER_ID),
    status: 201,
    body: SENT_MAIL_ID,
  });
});
