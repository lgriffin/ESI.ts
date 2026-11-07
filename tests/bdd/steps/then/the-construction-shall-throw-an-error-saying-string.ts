import { Then } from '../../support/steps';

Then(
  'the construction shall throw an error saying {string}',
  function (text: string) {
    expect(this.error).toBeInstanceOf(Error);
    expect((this.error as Error).message).toContain(text);
  },
);
