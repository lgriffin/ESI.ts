import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with a TypeError saying {string}',
  function (text: string) {
    expect(this.error).toBeInstanceOf(TypeError);
    expect((this.error as Error).message).toContain(text);
  },
);
