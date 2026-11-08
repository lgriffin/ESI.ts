import type { RecordingLogger } from '../../support/logging';
import { Then } from '../../support/steps';

Then(
  "the factory client's logger shall have received {string}",
  function (message: string) {
    const logger = this.values.factoryLogger as RecordingLogger;
    expect(logger.lines.map((line) => line.message)).toContain(message);
  },
);
