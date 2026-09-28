import { Then } from '../../support/steps';

Then('the build number shall be {string}', function (buildNumber: string) {
  expect(this.result.buildNumber).toBe(buildNumber);
});
