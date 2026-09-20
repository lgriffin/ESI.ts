import { Then } from '../../support/steps';

Then('war IDs shall be in descending order', function () {
  expect(this.result).toEqual([700010, 700009, 700008, 700007, 700006]);
  for (let i = 1; i < this.result.length; i++) {
    expect(this.result[i - 1]).toBeGreaterThan(this.result[i]);
  }
});
