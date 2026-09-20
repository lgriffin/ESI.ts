import { LATENCY_BUDGET_MS } from '../../support/alliance';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the response shall be within acceptable time limits', function () {
  expect(this.result.name).toBe('Latency Alliance');
  expect(sentRequests()).toHaveLength(1);
  expect(this.values.responseTime).toBeLessThan(LATENCY_BUDGET_MS);
  // The 100ms server delay really passed through the pipeline.
  expect(this.values.responseTime).toBeGreaterThanOrEqual(90);
});
