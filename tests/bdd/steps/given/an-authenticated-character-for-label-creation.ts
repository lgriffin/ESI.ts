import {
  CUSTOM_LABEL_ID,
  MAIL_CHARACTER_ID,
  mailPaths,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character for label creation', function () {
  queueResponse({
    match: mailPaths.labels(MAIL_CHARACTER_ID),
    status: 201,
    body: CUSTOM_LABEL_ID,
  });
});
