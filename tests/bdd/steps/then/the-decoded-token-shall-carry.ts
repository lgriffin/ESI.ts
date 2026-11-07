import { Then } from '../../support/steps';

Then('the decoded token shall carry:', function (fields: string) {
  expect(this.error).toBeUndefined();
  expect(this.result).toMatchObject(JSON.parse(fields));
});
