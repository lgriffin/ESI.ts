import type { RecordingLogger } from '../../support/logging';
import { Then } from '../../support/steps';

Then("the runtime's logger shall receive no warning", function () {
  expect(this.error).toBeUndefined();
  const logger = this.values.logger as RecordingLogger;
  expect(logger.lines.filter((line) => line.level === 'warn')).toEqual([]);
});
