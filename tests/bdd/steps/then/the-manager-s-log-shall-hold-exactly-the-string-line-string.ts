import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "the manager's log shall hold exactly the {string} line {string}",
  function (level: string, message: string) {
    const lines = manager(this).logger.lines.filter((l) => l.level === level);
    expect(lines.map((l) => l.message)).toEqual([message]);
  },
);
