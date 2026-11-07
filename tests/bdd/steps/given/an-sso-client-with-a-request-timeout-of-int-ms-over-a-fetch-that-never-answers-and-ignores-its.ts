import { ssoClient } from '../../support/sso-client';
import { Given } from '../../support/steps';

Given(
  'an SSO client with a request timeout of {int} ms over a fetch that never answers and ignores its abort signal',
  function (timeoutMs: number) {
    ssoClient(this, {
      timeoutMs,
      fetch: () => new Promise<Response>(() => undefined),
    });
  },
);
