import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the view shall receive no entries after one request', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toEqual([]);
  expect(sentRequests()).toHaveLength(1);
});
