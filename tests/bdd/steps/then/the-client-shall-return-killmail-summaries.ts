import { ACTIVE_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return killmail summaries', function () {
  expect(lastRequest().method).toBe('GET');
  expect(lastRequest().url.pathname).toBe(warPaths.killmails(ACTIVE_WAR_ID));
  expect(this.result).toEqual([
    { killmail_id: 90000001, killmail_hash: 'abc123def456' },
    { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
    { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
  ]);
});
