import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return a not found error for the dynamic item',
  function () {
    expect(this.error).toBeInstanceOf(EsiError);
    expect((this.error as EsiError).statusCode).toBe(404);
    expect(sentRequests()).toHaveLength(1);
  },
);
