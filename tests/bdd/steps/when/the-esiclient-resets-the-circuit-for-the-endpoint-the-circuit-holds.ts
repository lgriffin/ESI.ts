import { CIRCUIT_ENDPOINT, surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When(
  'the EsiClient resets the circuit for the endpoint the circuit holds',
  function () {
    (surfaceOf(this).built as EsiClient).resetCircuitBreaker(CIRCUIT_ENDPOINT);
  },
);
