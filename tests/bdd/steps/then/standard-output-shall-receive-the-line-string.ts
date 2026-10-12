import { CONSOLE_STREAMS } from '../../support/logging';
import { Then } from '../../support/steps';

Then('standard output shall receive the line {string}', function (line) {
  expect(this.values.console[CONSOLE_STREAMS['standard output']]).toEqual([
    line,
  ]);
});
