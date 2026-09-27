import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with NO_AUTH_TOKEN and no request shall be sent',
  function () {
    expect(this.error).toBeInstanceOf(Error);
    expect((this.error as Error).message).toMatch(/^\[NO_AUTH_TOKEN\] /);
    expect(sentRequests()).toHaveLength(0);
  },
);
