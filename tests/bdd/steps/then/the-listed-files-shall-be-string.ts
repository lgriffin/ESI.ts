import { Then } from '../../support/steps';

Then('the listed files shall be {string}', function (names: string) {
  expect([...this.result].sort()).toEqual(names.split(', ').sort());
});
