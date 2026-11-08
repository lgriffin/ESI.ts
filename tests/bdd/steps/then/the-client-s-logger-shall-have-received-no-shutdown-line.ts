import type { RecordingLogger } from '../../support/logging';
import { Then } from '../../support/steps';

Then("the client's logger shall have received no shutdown line", function () {
  const logger = this.values.logger as RecordingLogger;
  const lines = logger.lines.map((line) => line.message);
  expect(lines.length).toBeGreaterThan(0);
  expect(lines.filter((line) => line.includes('shutdown'))).toEqual([]);
});
