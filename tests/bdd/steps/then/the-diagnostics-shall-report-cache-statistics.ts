import { apiClientOf } from '../../support/pipeline-parts';
import { diagnosticsFor } from '../../../../src/core/pipelineOwnership';
import { Then } from '../../support/steps';

Then('the diagnostics shall report cache statistics', function () {
  expect(diagnosticsFor(apiClientOf(this)).getCacheStats()).not.toBeNull();
});
