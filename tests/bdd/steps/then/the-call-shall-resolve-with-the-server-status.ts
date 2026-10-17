import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then('the call shall resolve with the server status', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toEqual(serverStatus());
});
