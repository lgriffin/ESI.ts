import { EMPTY_INBOX_CHARACTER_ID, mailPaths } from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an empty mail list', function () {
  expect(lastRequest().url.pathname).toBe(
    mailPaths.headers(EMPTY_INBOX_CHARACTER_ID),
  );
  expect(this.result).toEqual([]);
});
