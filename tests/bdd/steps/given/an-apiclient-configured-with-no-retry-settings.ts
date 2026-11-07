import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given('an ApiClient configured with no retry settings', function () {
  useConfiguredClient(this);
});
