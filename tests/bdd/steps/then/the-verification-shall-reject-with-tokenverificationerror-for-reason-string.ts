import { TokenVerificationError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the verification shall reject with TokenVerificationError for reason {string}',
  function (reason: string) {
    const error = this.error as TokenVerificationError;
    expect(error).toBeInstanceOf(TokenVerificationError);
    expect(error.reason).toBe(reason);
  },
);
