import { Then } from '../../support/steps';

Then('both refreshes shall give {string}', function (token: string) {
  expect(this.result).toEqual([token, token]);
});
