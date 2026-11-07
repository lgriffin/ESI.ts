import { ssoForms } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "SSO's token endpoint shall have received {int} requests",
  function (count: number) {
    expect(ssoForms('/v2/oauth/token')).toHaveLength(count);
  },
);
