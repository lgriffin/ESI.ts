import { Then } from '../../support/steps';

Then('the limiter shall have waited {int} times', function (count: number) {
  expect((this.values.lastWaits as number[]).length).toBe(count);
});
