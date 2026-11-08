import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with a query VALIDATION_ERROR saying {string}',
  function (reason: string) {
    expect(this.error).toBeInstanceOf(EsiConfigurationError);
    const error = this.error as EsiConfigurationError;
    expect(error.message).toMatch(/^\[VALIDATION_ERROR\] Query parameter '/);
    expect(error.message).toContain(reason);
  },
);
