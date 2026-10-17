import { STATUS_ENDPOINT_DEPRECATION } from '../../support/custom-client';
import type { RecordingLogger } from '../../support/logging';
import { Then } from '../../support/steps';

Then(
  "the custom client's logger shall receive one warning naming the server status endpoint, the route status and the sunset date",
  function () {
    expect(this.error).toBeUndefined();
    const logger = this.values.logger as RecordingLogger;
    const warnings = logger.lines.filter((line) => line.level === 'warn');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toBe(
      `Endpoint 'getStatus' is deprecated. ${STATUS_ENDPOINT_DEPRECATION.message} Use '${STATUS_ENDPOINT_DEPRECATION.replacedBy}' instead. Sunset date: ${STATUS_ENDPOINT_DEPRECATION.sunsetDate}.`,
    );
    expect(warnings[0]!.context).toEqual({ endpoint: 'getStatus' });
  },
);
