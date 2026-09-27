import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the second call shall be rejected with status {int}',
  function (status: number) {
    expect(this.values.second).toBeUndefined();
    expect(this.values.secondError).toBeInstanceOf(EsiError);
    expect((this.values.secondError as EsiError).statusCode).toBe(status);
  },
);
