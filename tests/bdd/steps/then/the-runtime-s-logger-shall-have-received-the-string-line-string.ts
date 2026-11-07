import { Then } from '../../support/steps';

Then(
  "the runtime's logger shall have received the {string} line {string}",
  function (level: string, message: string) {
    const lines = this.values.logger.lines as Array<{
      level: string;
      message: string;
    }>;
    expect(
      lines.filter((l) => l.level === level).map((l) => l.message),
    ).toContain(message);
  },
);
