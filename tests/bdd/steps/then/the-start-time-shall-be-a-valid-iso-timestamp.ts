import { START_TIME } from '../../support/status';
import { Then } from '../../support/steps';

Then('the start time shall be a valid ISO timestamp', function () {
  expect(this.result.start_time).toBe(START_TIME);
  const parsedDate = new Date(this.result.start_time);
  expect(parsedDate.getTime()).toBe(Date.UTC(2024, 0, 15, 11, 5, 0));
});
