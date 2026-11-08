import { queueTokenAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next refresh with the opaque access token {string}',
  function (accessToken: string) {
    queueTokenAnswer({ accessToken });
  },
);
