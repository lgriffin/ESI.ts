import { SsoError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the call shall reject with an SsoError with status {int} and the error code {string}',
  function (status: number, errorCode: string) {
    const error = this.error as SsoError;
    expect(error).toBeInstanceOf(SsoError);
    expect([error.statusCode, error.errorCode]).toEqual([status, errorCode]);
  },
);
