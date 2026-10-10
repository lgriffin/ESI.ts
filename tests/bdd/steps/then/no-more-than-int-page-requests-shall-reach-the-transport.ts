import { pageRequestsSent } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then(
  'no more than {int} page requests shall reach the transport',
  function (cap: number) {
    expect(pageRequestsSent()).toBeLessThanOrEqual(cap);
  },
);
