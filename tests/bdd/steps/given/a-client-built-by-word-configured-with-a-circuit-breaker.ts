import { buildSurface, type Surface } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} configured with a circuit breaker',
  function (surface: string) {
    buildSurface(this, surface as Surface, { enableCircuitBreaker: true });
  },
);
