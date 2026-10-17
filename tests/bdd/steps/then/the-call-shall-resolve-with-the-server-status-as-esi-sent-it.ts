import { Then } from '../../support/steps';

Then(
  'the call shall resolve with the server status as ESI sent it',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual(this.values.sentBody);
  },
);
