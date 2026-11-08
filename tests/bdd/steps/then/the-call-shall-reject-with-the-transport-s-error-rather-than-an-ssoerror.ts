import { SsoError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  "the call shall reject with the transport's error rather than an SsoError",
  function () {
    expect(this.error).toBeInstanceOf(TypeError);
    expect(this.error).not.toBeInstanceOf(SsoError);
  },
);
