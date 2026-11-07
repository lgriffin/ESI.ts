import { EsiError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the clearance shall be refused with status {int} saying {string}',
  function (status: number, message: string) {
    expect(this.error).toBeInstanceOf(EsiError);
    const error = this.error as EsiError;
    expect([error.statusCode, error.message]).toEqual([status, message]);
  },
);
