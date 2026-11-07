import { EsiValidationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with a request EsiValidationError',
  function () {
    expect(this.error).toBeInstanceOf(EsiValidationError);
    expect((this.error as EsiValidationError).direction).toBe('request');
  },
);
