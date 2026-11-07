import { Then } from '../../support/steps';

Then(
  'the response metadata shall carry the warning {int} with the text {string}',
  function (code: number, message: string) {
    expect(this.error).toBeUndefined();
    expect(this.result.meta.warning).toEqual({ code, message });
  },
);
