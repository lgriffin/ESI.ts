import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with every middleware built for it',
  function () {
    useConfiguredClient(this, { enableCircuitBreaker: true });
  },
);
