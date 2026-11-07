import { Then } from '../../support/steps';

Then('the URL shall carry no {string} parameter', function (name: string) {
  expect((this.result as URL).searchParams.has(name)).toBe(false);
});
