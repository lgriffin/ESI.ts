import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the creation shall throw an EsiConfigurationError {string} saying {string}',
  function (code: string, text: string) {
    const error = this.error as EsiConfigurationError;
    expect(error).toBeInstanceOf(EsiConfigurationError);
    expect(error.code).toBe(code);
    expect(error.message).toContain(text);
  },
);
