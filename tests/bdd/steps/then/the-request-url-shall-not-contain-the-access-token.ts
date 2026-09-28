import { SEAM_ACCESS_TOKEN, lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the request URL shall not contain the access token', function () {
  expect(this.result).toBeDefined();
  const url = lastRequest().url;
  expect(url.href).not.toContain(SEAM_ACCESS_TOKEN);
  expect([...url.searchParams.keys()]).not.toContain('token');
});
