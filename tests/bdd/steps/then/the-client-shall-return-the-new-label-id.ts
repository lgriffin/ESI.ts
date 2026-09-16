import {
  MAIL_CHARACTER_ID,
  lastRequestBody,
  mailPaths,
} from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the new label ID', function () {
  const request = lastRequest();
  expect(request.method).toBe('POST');
  expect(request.url.pathname).toBe(mailPaths.labels(MAIL_CHARACTER_ID));
  expect(lastRequestBody()).toEqual({ name: 'Important', color: '#ff6600' });
  expect(this.result).toBe(128);
});
