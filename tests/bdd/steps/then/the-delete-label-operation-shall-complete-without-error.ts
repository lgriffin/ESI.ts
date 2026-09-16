import {
  CUSTOM_LABEL_ID,
  MAIL_CHARACTER_ID,
  mailPaths,
} from '../../support/mail';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the delete label operation shall complete without error', function () {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  expect(request.method).toBe('DELETE');
  expect(request.url.pathname).toBe(
    mailPaths.label(MAIL_CHARACTER_ID, CUSTOM_LABEL_ID),
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(request.body).toBeUndefined();
});
