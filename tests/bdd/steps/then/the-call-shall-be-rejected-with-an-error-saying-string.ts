import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with an Error saying {string}',
  function (text: string) {
    expect(this.error).toBeInstanceOf(Error);
    expect((this.error as Error).message).toContain(text);
  },
);
