import { Then } from '../../support/steps';

Then('the release date shall be {string}', function (releaseDate: string) {
  expect(this.result.releaseDate).toBe(releaseDate);
});
