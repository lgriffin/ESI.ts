import { CircuitOpenError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the check shall be refused with a CircuitOpenError retrying after {int} ms',
  function (ms: number) {
    expect(this.error).toBeInstanceOf(CircuitOpenError);
    expect((this.error as CircuitOpenError).retryAfterMs).toBe(ms);
  },
);
