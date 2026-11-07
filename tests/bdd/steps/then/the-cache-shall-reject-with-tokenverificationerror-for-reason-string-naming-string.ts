import { TokenVerificationError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the cache shall reject with TokenVerificationError for reason {string} naming {string}',
  function (reason: string, text: string) {
    const error = this.error as TokenVerificationError;
    expect(error).toBeInstanceOf(TokenVerificationError);
    expect(error.reason).toBe(reason);
    expect(error.message).toContain(text);
  },
);
