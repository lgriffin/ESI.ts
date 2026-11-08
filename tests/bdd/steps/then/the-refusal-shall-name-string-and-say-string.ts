import { Then } from '../../support/steps';

Then(
  'the refusal shall name {string} and say {string}',
  function (scope: string, advice: string) {
    const message = (this.error as Error).message;
    expect(message).toContain(scope);
    expect(message).toContain(advice);
  },
);
