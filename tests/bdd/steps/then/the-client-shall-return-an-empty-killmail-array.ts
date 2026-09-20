import { EMPTY_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an empty killmail array', function () {
  expect(lastRequest().url.pathname).toBe(warPaths.killmails(EMPTY_WAR_ID));
  expect(this.result).toEqual([]);
});
