import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { jwtWithout, queueTokenAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next refresh with an access token that has no scopes',
  function () {
    queueTokenAnswer({ accessToken: jwtWithout(makeJwt(), 'scp') });
  },
);
