import { EsiConfigurationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the call shall be refused with an EsiConfigurationError naming {string}',
  function (call: string) {
    expect(this.error).toBeInstanceOf(EsiConfigurationError);
    expect((this.error as Error).message).toContain(call);
  },
);
