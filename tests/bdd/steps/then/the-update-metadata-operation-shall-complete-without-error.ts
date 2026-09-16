import {
  MAIL_CHARACTER_ID,
  MAIL_ID,
  lastRequestBody,
  mailPaths,
} from '../../support/mail';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the update metadata operation shall complete without error', function () {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  expect(request.method).toBe('PUT');
  expect(request.url.pathname).toBe(mailPaths.mail(MAIL_CHARACTER_ID, MAIL_ID));
  expect(lastRequestBody()).toEqual({ read: true, labels: [1, 4] });
});
