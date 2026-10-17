import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then(
  'the result shall be ok and hold the server status as its data',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result.ok).toBe(true);
    expect(this.result.data).toEqual(serverStatus());
  },
);
