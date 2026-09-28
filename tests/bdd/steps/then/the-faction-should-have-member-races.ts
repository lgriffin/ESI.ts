import { Then } from '../../support/steps';

Then('the faction should have member races', function () {
  expect(this.result.memberRaces).toBeDefined();
  expect(this.result.memberRaces.length).toBeGreaterThanOrEqual(1);
});
