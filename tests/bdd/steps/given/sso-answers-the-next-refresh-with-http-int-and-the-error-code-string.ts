import { queueTokenError } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next refresh with HTTP {int} and the error code {string}',
  function (status: number, errorCode: string) {
    queueTokenError(status, errorCode);
  },
);
