import { Then } from '../../support/steps';

Then('the error message shall end with {string}', function (text: string) {
  expect((this.error as Error).message.endsWith(text)).toBe(true);
});
