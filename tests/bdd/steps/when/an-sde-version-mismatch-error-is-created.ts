import { SdeVersionMismatchError } from '../../../../src/sde/errors';
import { When } from '../../support/steps';

When('an SDE version mismatch error is created', function () {
  this.error = new SdeVersionMismatchError(
    this.values.expected,
    this.values.actual,
  );
});
