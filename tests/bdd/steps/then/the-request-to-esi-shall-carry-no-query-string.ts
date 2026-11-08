import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the request to ESI shall carry no query string', function () {
  expect(this.error).toBeUndefined();
  expect(lastRequest().url.href).not.toContain('?');
});
