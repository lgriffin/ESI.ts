import { TokenDecodeError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the decoding shall throw TokenDecodeError saying {string}',
  function (text: string) {
    const error = this.error as TokenDecodeError;
    expect(error).toBeInstanceOf(TokenDecodeError);
    expect(error.message).toContain(text);
  },
);
