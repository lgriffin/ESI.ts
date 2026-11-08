import { Then } from '../../support/steps';

Then(
  'the global logger shall receive only the {string} line {string}',
  function (level: string, message: string) {
    const lines = this.values.logger.lines;
    expect(
      lines.map((l: { level: string; message: string }) => [
        l.level,
        l.message,
      ]),
    ).toEqual([[level, message]]);
  },
);
