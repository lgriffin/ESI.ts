import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the helper shall resolve with an empty list after {int} request',
  function (count: number) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual([]);
    expect(sentRequests()).toHaveLength(count);
  },
);
