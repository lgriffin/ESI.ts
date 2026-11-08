import {
  jwksBody,
  signingKey,
} from '../../step-definitions/shared/sso-helpers';
import { queueResponse } from '../../support/transport';
import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  'EVE SSO publishes its current signing key on the global fetch',
  function () {
    verificationState(this);
    queueResponse({
      match: '/oauth/jwks',
      body: jwksBody([signingKey()]),
      times: 2,
    });
  },
);
