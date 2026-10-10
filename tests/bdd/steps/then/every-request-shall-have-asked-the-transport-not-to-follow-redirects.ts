import { everyRequestRefusesRedirects } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then(
  'every request shall have asked the transport not to follow redirects',
  function () {
    expect(everyRequestRefusesRedirects()).toBe(true);
  },
);
