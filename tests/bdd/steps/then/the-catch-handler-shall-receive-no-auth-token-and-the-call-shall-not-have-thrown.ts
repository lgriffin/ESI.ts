import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the catch handler shall receive NO_AUTH_TOKEN and the call shall not have thrown',
  function () {
    expect(this.values.thrown).toBe(false);
    expect((this.error as Error).message).toMatch(/^\[NO_AUTH_TOKEN\] /);
    expect(sentRequests()).toHaveLength(0);
  },
);
