import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "the manager's log shall hold a {string} line containing {string}",
  function (level: string, text: string) {
    const lines = manager(this).logger.lines.filter((l) => l.level === level);
    expect(lines.some((l) => l.message.includes(text))).toBe(true);
  },
);
