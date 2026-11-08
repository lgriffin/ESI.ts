import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the construction shall fail with a VALIDATION_ERROR saying {string}',
  function (reason: string) {
    expect(this.error).toBeInstanceOf(EsiConfigurationError);
    const error = this.error as EsiConfigurationError;
    expect(error.message).toMatch(/^\[VALIDATION_ERROR\] /);
    expect(error.message).toContain(reason);
  },
);
