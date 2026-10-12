import { Then } from '../../support/steps';

Then(
  'standard output shall receive a line starting with {string}',
  function (prefix) {
    const lines: string[] = this.values.console.log;
    expect(lines.filter((line) => line.startsWith(prefix))).toHaveLength(1);
  },
);
