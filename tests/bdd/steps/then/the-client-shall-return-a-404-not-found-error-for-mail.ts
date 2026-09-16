import { EsiError } from '../../../../src/core/util/error';
import {
  MAIL_CHARACTER_ID,
  UNKNOWN_MAIL_ID,
  mailPaths,
} from '../../support/mail';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 404 not found error for mail', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(404);
  expect(sentRequests()).toHaveLength(1);
  expect(lastRequest().url.pathname).toBe(
    mailPaths.mail(MAIL_CHARACTER_ID, UNKNOWN_MAIL_ID),
  );
});
