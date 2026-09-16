import { EMPTY_INBOX_CHARACTER_ID, mailHeadersMatch } from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with no mail', function () {
  queueResponse({
    match: mailHeadersMatch(EMPTY_INBOX_CHARACTER_ID),
    body: [],
  });
});
