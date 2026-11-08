import { apiClientOf } from '../../support/pipeline-parts';
import { diagnosticsFor } from '../../../../src/core/pipelineOwnership';
import { Then } from '../../support/steps';

Then('the diagnostics asked for twice shall be the same object', function () {
  const client = apiClientOf(this);
  const first = diagnosticsFor(client);
  expect(first).toBeDefined();
  expect(diagnosticsFor(client)).toBe(first);
});
