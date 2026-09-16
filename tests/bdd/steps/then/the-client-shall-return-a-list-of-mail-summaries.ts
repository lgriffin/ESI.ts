import { MAIL_CHARACTER_ID, mailFixtures, mailPaths } from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a list of mail summaries', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toBe(mailPaths.headers(MAIL_CHARACTER_ID));
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(mailFixtures.inboxHeaders());
  expect(
    this.result.map((h: any) => [
      h.mail_id,
      h.from,
      h.subject,
      h.timestamp,
      h.is_read,
    ]),
  ).toEqual([
    [1, 123456789, 'Fleet Operation Tonight', '2024-01-15T18:00:00Z', false],
    [2, 987654321, 'Contract Completed', '2024-01-15T12:00:00Z', true],
    [3, 111111111, 'Welcome to the Corporation', '2024-01-14T09:00:00Z', true],
  ]);
});
