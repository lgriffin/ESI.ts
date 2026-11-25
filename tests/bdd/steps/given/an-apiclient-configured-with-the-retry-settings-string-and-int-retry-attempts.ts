import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with the retry settings {string} and {int} retry attempts',
  function (settings: string, retryAttempts: number) {
    useConfiguredClient(this, {
      retryConfig: JSON.parse(settings),
      retryAttempts,
    });
  },
);
