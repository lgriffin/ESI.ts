import { EsiValidationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('both calls shall be rejected with an EsiValidationError', function () {
  const errors = this.values.errors as unknown[];
  expect(errors).toHaveLength(2);
  for (const error of errors) expect(error).toBeInstanceOf(EsiValidationError);
});
