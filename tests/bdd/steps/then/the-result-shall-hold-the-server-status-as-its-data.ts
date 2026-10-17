import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then('the result shall hold the server status as its data', function () {
  expect(this.error).toBeUndefined();
  expect(this.result.data).toEqual(serverStatus());
});
