import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the runtime shall have sent {int} requests', function (count: number) {
  expect(sentRequests()).toHaveLength(count);
});
