import {
  CUSTOM_LABEL_ID,
  MAIL_CHARACTER_ID,
  mailPaths,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with a custom label', function () {
  queueResponse({
    match: mailPaths.label(MAIL_CHARACTER_ID, CUSTOM_LABEL_ID),
    status: 204,
  });
});
