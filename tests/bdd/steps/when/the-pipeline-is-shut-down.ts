import { apiClientOf } from '../../support/pipeline-parts';
import { shutdownOwnedPipeline } from '../../../../src/core/pipelineOwnership';
import { When } from '../../support/steps';

When('the pipeline is shut down', function () {
  this.result = shutdownOwnedPipeline(apiClientOf(this));
});
