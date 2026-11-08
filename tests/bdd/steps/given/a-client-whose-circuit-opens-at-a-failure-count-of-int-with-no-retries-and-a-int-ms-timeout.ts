import { breakerClient } from '../../support/pipeline-edges';
import { Given } from '../../support/steps';

Given(
  'a client whose circuit opens at a failure count of {int}, with no retries and a {int} ms timeout',
  function (failureThreshold: number, timeout: number) {
    breakerClient(this, { failureThreshold }, timeout);
  },
);
