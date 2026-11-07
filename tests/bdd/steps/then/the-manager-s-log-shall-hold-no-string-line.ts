import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then("the manager's log shall hold no {string} line", function (level: string) {
  expect(this.error).toBeUndefined();
  const lines = manager(this).logger.lines.filter((l) => l.level === level);
  expect(lines).toEqual([]);
});
