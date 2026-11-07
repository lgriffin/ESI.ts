import { Then } from '../../support/steps';

Then(
  'the error message shall end with a reason of {int} characters',
  function (length: number) {
    const message = (this.error as Error).message;
    expect(message.endsWith(`: ${'r'.repeat(length)}`)).toBe(true);
    expect(message).not.toContain('r'.repeat(length + 1));
  },
);
