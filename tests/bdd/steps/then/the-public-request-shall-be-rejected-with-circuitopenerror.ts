import { isCircuitOpen } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the public request shall be rejected with CircuitOpenError', function () {
  expect(isCircuitOpen(this.error)).toBe(true);
});
