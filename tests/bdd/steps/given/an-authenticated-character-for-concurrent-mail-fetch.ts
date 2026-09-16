import {
  MAIL_CHARACTER_ID,
  mailFixtures,
  mailHeadersMatch,
  mailPaths,
} from '../../support/mail';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character for concurrent mail fetch', function () {
  // Each response is delayed differently so they settle out of request
  // order; a client that mixed them up would hand back the wrong payload.
  queueResponse({
    match: mailHeadersMatch(MAIL_CHARACTER_ID),
    body: mailFixtures.singleHeader(),
    delayMs: 30,
  });
  queueResponse({
    match: mailPaths.labels(MAIL_CHARACTER_ID),
    body: mailFixtures.singleLabel(),
    delayMs: 15,
  });
  queueResponse({
    match: mailPaths.lists(MAIL_CHARACTER_ID),
    body: mailFixtures.singleMailingList(),
  });
});
