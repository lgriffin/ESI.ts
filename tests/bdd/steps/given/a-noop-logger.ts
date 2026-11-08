import { createNoopLogger } from '../../../../src/core/logger/NoopLogger';
import { Given } from '../../support/steps';

Given('a noop logger', function () {
  this.values.subjectLogger = createNoopLogger();
});
