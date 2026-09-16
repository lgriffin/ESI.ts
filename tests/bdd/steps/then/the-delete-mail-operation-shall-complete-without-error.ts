import { MAIL_CHARACTER_ID, MAIL_ID, mailPaths } from '../../support/mail';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the delete mail operation shall complete without error', function () {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  expect(request.method).toBe('DELETE');
  expect(request.url.pathname).toBe(mailPaths.mail(MAIL_CHARACTER_ID, MAIL_ID));
  expect(request.body).toBeUndefined();
});
