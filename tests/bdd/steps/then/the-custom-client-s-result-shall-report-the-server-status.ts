import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then("the custom client's result shall report the server status", function () {
  expect(this.result).toEqual(serverStatus());
});
