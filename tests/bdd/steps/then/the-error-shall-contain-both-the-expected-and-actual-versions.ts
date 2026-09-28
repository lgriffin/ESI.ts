import { type SdeVersionMismatchError } from '../../../../src/sde/errors';
import { Then } from '../../support/steps';

Then(
  'the error shall contain both the expected and actual versions',
  function () {
    const error = this.error as SdeVersionMismatchError;
    expect(error.expected).toBe(this.values.expected);
    expect(error.actual).toBe(this.values.actual);
    expect(error.message).toContain(this.values.expected);
    expect(error.message).toContain(this.values.actual);
  },
);
