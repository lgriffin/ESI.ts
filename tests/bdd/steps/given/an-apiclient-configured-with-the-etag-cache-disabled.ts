import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given('an ApiClient configured with the ETag cache disabled', function () {
  useConfiguredClient(this, { enableETagCache: false });
});
