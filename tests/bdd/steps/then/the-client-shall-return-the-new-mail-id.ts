import {
  MAIL_CHARACTER_ID,
  lastRequestBody,
  mailFixtures,
  mailPaths,
} from '../../support/mail';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the new mail ID', function () {
  const request = lastRequest();
  expect(sentRequests()).toHaveLength(1);
  expect(request.method).toBe('POST');
  expect(request.url.pathname).toBe(mailPaths.headers(MAIL_CHARACTER_ID));
  expect(lastRequestBody()).toEqual(mailFixtures.outgoingMail());
  expect(this.result).toBe(331477592);
});
