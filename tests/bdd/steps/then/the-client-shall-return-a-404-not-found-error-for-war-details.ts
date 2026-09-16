import { EsiError } from '../../../../src/core/util/error';
import { UNKNOWN_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return a 404 not found error for war details',
  function () {
    expect(this.error).toBeInstanceOf(EsiError);
    expect((this.error as EsiError).statusCode).toBe(404);
    // 404 is not retried.
    expect(sentRequests()).toHaveLength(1);
    expect(lastRequest().url.pathname).toBe(warPaths.war(UNKNOWN_WAR_ID));
  },
);
