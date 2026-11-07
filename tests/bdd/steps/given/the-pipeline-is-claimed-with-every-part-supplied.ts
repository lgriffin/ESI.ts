import { apiClientOf } from '../../support/pipeline-parts';
import { claimPipeline } from '../../../../src/core/pipelineOwnership';
import { Given } from '../../support/steps';

Given('the pipeline is claimed with every part supplied', function () {
  claimPipeline(apiClientOf(this), {
    suppliedCache: true,
    suppliedCircuitBreaker: true,
    suppliedDeduplicator: true,
  });
});
