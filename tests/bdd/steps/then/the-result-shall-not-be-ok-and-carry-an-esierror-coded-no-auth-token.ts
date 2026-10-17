import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the result shall not be ok and carry an EsiError coded NO_AUTH_TOKEN',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result.ok).toBe(false);
    expect(this.result.error).toBeInstanceOf(EsiError);
    expect(this.result.error.code).toBe('NO_AUTH_TOKEN');
  },
);
