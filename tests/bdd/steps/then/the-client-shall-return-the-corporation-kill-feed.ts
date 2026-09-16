import {
  CORPORATION_ID,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the corporation kill feed', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(
    new RegExp(`${killmailPaths.corporationRecent(CORPORATION_ID)}/?$`),
  );
  expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(killmailFixtures.corporationSummaries());
  for (const summary of this.result) {
    expect(typeof summary.killmail_id).toBe('number');
    expect(typeof summary.killmail_hash).toBe('string');
  }
});
