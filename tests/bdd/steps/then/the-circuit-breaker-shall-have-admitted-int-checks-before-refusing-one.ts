import { CircuitOpenError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the circuit breaker shall have admitted {int} checks before refusing one',
  function (admitted: number) {
    expect(this.result).toBe(admitted);
    expect(this.error).toBeInstanceOf(CircuitOpenError);
  },
);
