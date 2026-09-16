import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an empty killmail list', function () {
  expect(sentRequests()).toHaveLength(1);
  expect(this.result).toEqual([]);
});
