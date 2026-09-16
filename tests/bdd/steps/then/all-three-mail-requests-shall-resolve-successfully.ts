import { MAIL_CHARACTER_ID, mailFixtures, mailPaths } from '../../support/mail';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('all three mail requests shall resolve successfully', function () {
  expect(
    sentRequests()
      .map((r) => r.url.pathname)
      .sort(),
  ).toEqual(
    [
      mailPaths.headers(MAIL_CHARACTER_ID),
      mailPaths.labels(MAIL_CHARACTER_ID),
      mailPaths.lists(MAIL_CHARACTER_ID),
    ].sort(),
  );
  expect(this.values.headers).toEqual(mailFixtures.singleHeader());
  expect(this.values.labels).toEqual(mailFixtures.singleLabel());
  expect(this.values.lists).toEqual(mailFixtures.singleMailingList());
});
