import { CircuitOpenError } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { Then } from '../../support/steps';

Then('the retry shall have failed with a CircuitOpenError', function () {
  expect(this.error).toBeInstanceOf(CircuitOpenError);
});
