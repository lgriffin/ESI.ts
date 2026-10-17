import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the result shall not be ok and carry an EsiError with status {int}',
  function (status: number) {
    expect(this.error).toBeUndefined();
    expect(this.result.ok).toBe(false);
    expect(this.result.error).toBeInstanceOf(EsiError);
    expect(this.result.error.statusCode).toBe(status);
  },
);
