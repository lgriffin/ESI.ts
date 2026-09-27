import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the second call shall be rejected with a configuration error',
  function () {
    expect(this.values.second).toBeUndefined();
    expect(this.values.secondError).toBeInstanceOf(EsiConfigurationError);
    expect((this.values.secondError as EsiConfigurationError).code).toBe(
      'CONFIGURATION_ERROR',
    );
  },
);
