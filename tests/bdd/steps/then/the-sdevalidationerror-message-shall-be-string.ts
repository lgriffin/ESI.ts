import { type SdeValidationError } from '../../../../src/sde/errors';
import { Then } from '../../support/steps';

Then(
  'the SdeValidationError message shall be {string}',
  function (message: string) {
    const error = this.error as SdeValidationError | null;
    expect(error).not.toBeNull();
    expect(error!.message).toBe(message);
  },
);
