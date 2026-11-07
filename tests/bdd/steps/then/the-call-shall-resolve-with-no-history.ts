import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the call shall resolve with no history', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toEqual([]);
  expect(sentRequests()).toHaveLength(1);
});
