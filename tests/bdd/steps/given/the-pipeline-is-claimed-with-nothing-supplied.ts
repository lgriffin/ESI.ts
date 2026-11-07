import { apiClientOf } from '../../support/pipeline-parts';
import { claimPipeline } from '../../../../src/core/pipelineOwnership';
import { Given } from '../../support/steps';

Given('the pipeline is claimed with nothing supplied', function () {
  claimPipeline(apiClientOf(this), {
    suppliedCache: false,
    suppliedCircuitBreaker: false,
    suppliedDeduplicator: false,
  });
});
