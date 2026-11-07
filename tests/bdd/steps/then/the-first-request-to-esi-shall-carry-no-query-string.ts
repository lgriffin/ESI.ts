import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the first request to ESI shall carry no query string', function () {
  expect(sentRequests()[0]!.url.href).not.toContain('?');
});
