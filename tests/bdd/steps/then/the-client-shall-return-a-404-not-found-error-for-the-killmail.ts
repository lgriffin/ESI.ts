import { EsiError } from '../../../../src/core/util/error';
import { MISMATCHED_KILLMAIL, killmailPaths } from '../../support/killmails';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return a 404 not found error for the killmail',
  function () {
    expect(this.error).toBeInstanceOf(EsiError);
    expect((this.error as EsiError).statusCode).toBe(404);
    // 404 is not retryable: exactly one request reached ESI.
    expect(sentRequests()).toHaveLength(1);
    expect(lastRequest().url.pathname).toContain(
      killmailPaths.detail(MISMATCHED_KILLMAIL),
    );
  },
);
