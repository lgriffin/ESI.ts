import type { RecordingLogger } from '../../support/logging';
import { STATUS_DEPRECATION } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the runtime's logger shall receive one warning naming the server status operation, the route status and the sunset date",
  function () {
    expect(this.error).toBeUndefined();
    const logger = this.values.logger as RecordingLogger;
    const warnings = logger.lines.filter((line) => line.level === 'warn');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toBe(
      `Operation 'GetStatus' is deprecated. ${STATUS_DEPRECATION.message} Use '${STATUS_DEPRECATION.replacedBy}' instead. Sunset date: ${STATUS_DEPRECATION.sunsetDate}.`,
    );
    expect(warnings[0]!.context).toEqual({ operationId: 'GetStatus' });
  },
);
