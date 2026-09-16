import {
  PILOT_CHARACTER_ID,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a list of killmail summaries', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(
    new RegExp(`${killmailPaths.characterRecent(PILOT_CHARACTER_ID)}/?$`),
  );
  expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(killmailFixtures.characterSummaries());
  for (const summary of this.result) {
    expect(typeof summary.killmail_id).toBe('number');
    expect(typeof summary.killmail_hash).toBe('string');
  }
});
