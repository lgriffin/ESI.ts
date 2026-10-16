import { EsiValidationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with an EsiValidationError naming {string}',
  function (path: string) {
    expect(this.error).toBeInstanceOf(EsiValidationError);
    const error = this.error as EsiValidationError;
    expect(error.direction).toBe('response');
    expect(error.message).toContain(path);
  },
);
