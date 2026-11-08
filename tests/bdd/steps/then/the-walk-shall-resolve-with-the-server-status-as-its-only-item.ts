import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then(
  'the walk shall resolve with the server status as its only item',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual([serverStatus()]);
  },
);
