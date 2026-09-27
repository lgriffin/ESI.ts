import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the runtime shall have sent {int} request', function (count: number) {
  expect(sentRequests()).toHaveLength(count);
});
