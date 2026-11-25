import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with the retry settings {string}',
  function (settings: string) {
    useConfiguredClient(this, { retryConfig: JSON.parse(settings) });
  },
);
