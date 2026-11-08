import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with an EsiError with status {int} whose message says {string}',
  function (status: number, text: string) {
    expect(this.error).toBeInstanceOf(EsiError);
    const error = this.error as EsiError;
    expect(error.statusCode).toBe(status);
    expect(error.message).toContain(text);
  },
);
