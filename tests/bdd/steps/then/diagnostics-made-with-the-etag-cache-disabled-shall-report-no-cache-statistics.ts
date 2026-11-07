import { apiClientOf } from '../../support/pipeline-parts';
import { diagnosticsFor } from '../../../../src/core/pipelineOwnership';
import { Then } from '../../support/steps';

Then(
  'diagnostics made with the ETag cache disabled shall report no cache statistics',
  function () {
    expect(diagnosticsFor(apiClientOf(this), false).getCacheStats()).toBeNull();
  },
);
