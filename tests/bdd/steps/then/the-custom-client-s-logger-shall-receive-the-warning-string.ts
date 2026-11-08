import type { RecordingLogger } from '../../support/logging';
import { Then } from '../../support/steps';

Then(
  "the custom client's logger shall receive the warning {string}",
  function (message: string) {
    expect(this.error).toBeUndefined();
    const logger = this.values.logger as RecordingLogger;
    const warnings = logger.lines.filter((line) => line.level === 'warn');
    expect(warnings.map((line) => line.message)).toEqual([message]);
  },
);
