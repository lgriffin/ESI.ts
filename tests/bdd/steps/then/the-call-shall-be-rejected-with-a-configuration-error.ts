import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the call shall be rejected with a configuration error', function () {
  expect(this.result).toBeUndefined();
  expect(this.error).toBeInstanceOf(EsiConfigurationError);
  expect((this.error as EsiConfigurationError).code).toBe(
    'CONFIGURATION_ERROR',
  );
});
