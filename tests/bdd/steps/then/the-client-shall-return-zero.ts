import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return zero', function () {
  expect(sentRequests()).toHaveLength(1);
  expect(this.result).toBe(0);
});
