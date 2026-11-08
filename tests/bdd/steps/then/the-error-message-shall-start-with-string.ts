import { Then } from '../../support/steps';

Then('the error message shall start with {string}', function (text: string) {
  expect((this.error as Error).message.startsWith(text)).toBe(true);
});
