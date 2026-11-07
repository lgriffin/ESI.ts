import { SsoError } from '../../../../src/auth/errors';
import { When } from '../../support/steps';

When(
  'an SsoError is made with the status {int} and the error code {string}',
  function (status: number, errorCode: string) {
    this.result = new SsoError(status, errorCode);
  },
);
