import { CIRCUIT_ENDPOINT, surfaceOf } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given("the client's circuit breaker holds a circuit", function () {
  const breaker = surfaceOf(this).apiClient().getCircuitBreaker();
  if (!breaker) throw new Error('The client has no circuit breaker');
  breaker.recordFailure(CIRCUIT_ENDPOINT, 503);
});
