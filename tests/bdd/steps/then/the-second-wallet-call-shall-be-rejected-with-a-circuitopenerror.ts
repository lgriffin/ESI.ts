import { CircuitOpenError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the second wallet call shall be rejected with a CircuitOpenError',
  function () {
    const second = this.values.outcomes[1];
    expect(second.ok).toBe(false);
    expect(second.error).toBeInstanceOf(CircuitOpenError);
  },
);
