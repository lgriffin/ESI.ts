import { Then } from '../../support/steps';

Then(
  'the construction shall throw RangeError naming {string}',
  function (text: string) {
    expect(this.error).toBeInstanceOf(RangeError);
    expect((this.error as RangeError).message).toContain(text);
  },
);
