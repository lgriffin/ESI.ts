import { MAIL_CHARACTER_ID, mailFixtures, mailPaths } from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the mailing list details', function () {
  expect(lastRequest().url.pathname).toBe(mailPaths.lists(MAIL_CHARACTER_ID));
  expect(this.result).toEqual(mailFixtures.mailingLists());
  this.result.forEach((list: any) => {
    expect(typeof list.mailing_list_id).toBe('number');
    expect(typeof list.name).toBe('string');
  });
});
