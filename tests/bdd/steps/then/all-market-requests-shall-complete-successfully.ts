import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('all market requests shall complete successfully', function () {
  expect(sentRequests()).toHaveLength(3);
  expect(this.result.map((orders: any) => orders[0].order_id)).toEqual([
    5000000001, 5000000002, 5000000003,
  ]);
});
