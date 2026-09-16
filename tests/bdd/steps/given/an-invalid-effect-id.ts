import { UNKNOWN_DOGMA_ID, dogmaPaths } from '../../support/dogma';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid effect ID', function () {
  queueError(404, 'Effect not found', {
    match: dogmaPaths.effect(UNKNOWN_DOGMA_ID),
  });
});
