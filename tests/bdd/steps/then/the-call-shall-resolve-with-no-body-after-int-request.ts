import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the call shall resolve with no body after {int} request',
  function (count: number) {
    expect(this.error).toBeUndefined();
    expect(this.result).toBeUndefined();
    expect(sentRequests()).toHaveLength(count);
  },
);
