import { Then } from '../../support/steps';

Then(
  'the client shall return the contributed figure without a modification time',
  function () {
    expect(this.result).toEqual({ contributed: 0 });
    expect(this.result.last_modified).toBeUndefined();
  },
);
