import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('no request shall have been sent', function () {
  expect(sentRequests()).toHaveLength(0);
});
