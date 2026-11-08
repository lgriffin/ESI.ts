import { Then } from '../../support/steps';

Then('the error message shall not contain {string}', function (text: string) {
  expect((this.error as Error).message).not.toContain(text);
});
