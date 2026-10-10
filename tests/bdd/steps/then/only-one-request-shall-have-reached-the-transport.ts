import { pageRequestsSent } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then('only one request shall have reached the transport', function () {
  expect(pageRequestsSent()).toBe(1);
});
