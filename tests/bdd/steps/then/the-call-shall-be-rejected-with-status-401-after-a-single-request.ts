import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with status 401 after a single request',
  function () {
    expect(this.error).toMatchObject({ statusCode: 401 });
    expect(sentRequests()).toHaveLength(1);
  },
);
