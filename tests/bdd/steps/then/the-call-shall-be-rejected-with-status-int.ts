import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the call shall be rejected with status {int}', function (status: number) {
  expect(this.result).toBeUndefined();
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(status);
});
