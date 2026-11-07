import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with {int} retry attempts',
  function (retryAttempts: number) {
    useConfiguredClient(this, { retryAttempts });
  },
);
