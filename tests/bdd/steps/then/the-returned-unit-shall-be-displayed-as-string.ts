import { Then } from '../../support/steps';

Then(
  'the returned unit shall be displayed as {string}',
  function (displayName: string) {
    expect(this.result.displayName).toBe(displayName);
  },
);
