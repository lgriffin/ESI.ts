import { CONSOLE_STREAMS } from '../../support/logging';
import { Then } from '../../support/steps';

Then('the warning stream shall receive the line {string}', function (line) {
  expect(this.values.console[CONSOLE_STREAMS['the warning stream']]).toEqual([
    line,
  ]);
});
