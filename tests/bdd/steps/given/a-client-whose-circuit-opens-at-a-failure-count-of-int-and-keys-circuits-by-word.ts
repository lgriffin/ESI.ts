import { breakerClient } from '../../support/pipeline-edges';
import { Given } from '../../support/steps';

Given(
  'a client whose circuit opens at a failure count of {int} and keys circuits by {word}',
  function (failureThreshold: number, keyStrategy: string) {
    breakerClient(this, {
      failureThreshold,
      keyStrategy: keyStrategy as 'template' | 'resolved',
    });
  },
);
