import { MUTUAL_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the mutual flag shall be true', function () {
  expect(lastRequest().url.pathname).toBe(warPaths.war(MUTUAL_WAR_ID));
  expect(this.result.id).toBe(700003);
  expect(this.result.mutual).toBe(true);
  expect(this.result.open_for_allies).toBe(false);
});
