import { Then } from '../../support/steps';

Then(
  "the token manager's logger shall receive one {string} line containing {string}",
  function (level: string, text: string) {
    const lines = this.values.logger.lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].level).toBe(level);
    expect(lines[0].message).toContain(text);
  },
);
