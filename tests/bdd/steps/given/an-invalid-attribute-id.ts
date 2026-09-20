import { UNKNOWN_DOGMA_ID, dogmaPaths } from '../../support/dogma';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid attribute ID', function () {
  queueError(404, 'Attribute not found', {
    match: dogmaPaths.attribute(UNKNOWN_DOGMA_ID),
  });
});
