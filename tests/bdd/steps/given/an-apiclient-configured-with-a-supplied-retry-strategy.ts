import { useConfiguredClient } from '../../support/pipeline-parts';
import { RetryStrategy } from '../../../../src/core/RetryStrategy';
import { Given } from '../../support/steps';

Given('an ApiClient configured with a supplied retry strategy', function () {
  const retryStrategy = new RetryStrategy({ maxRetries: 1 });
  this.values.suppliedStrategy = retryStrategy;
  useConfiguredClient(this, { retryStrategy });
});
