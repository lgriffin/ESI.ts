import { apiClientOf } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given('the pipeline has a circuit and a request in flight', function () {
  const client = apiClientOf(this);
  client.getCircuitBreaker()?.recordFailure('/status/', 503);
  this.values.sent = 0;
  this.values.send = (): Promise<never> => {
    this.values.sent += 1;
    return new Promise<never>(() => {});
  };
  void client.getDeduplicator()?.dedupe('/status/', this.values.send);
});
