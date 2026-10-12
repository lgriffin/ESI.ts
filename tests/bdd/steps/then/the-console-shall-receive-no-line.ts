import { allConsoleLines } from '../../support/logging';
import { Then } from '../../support/steps';

Then('the console shall receive no line', function () {
  expect(allConsoleLines(this.values.console)).toEqual([]);
});
