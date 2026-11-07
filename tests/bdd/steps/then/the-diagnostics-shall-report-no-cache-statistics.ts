import { apiClientOf } from '../../support/pipeline-parts';
import { diagnosticsFor } from '../../../../src/core/pipelineOwnership';
import { Then } from '../../support/steps';

Then('the diagnostics shall report no cache statistics', function () {
  const client = apiClientOf(this);
  expect(client.getCache()).toBeNull();
  expect(diagnosticsFor(client).getCacheStats()).toBeNull();
});
