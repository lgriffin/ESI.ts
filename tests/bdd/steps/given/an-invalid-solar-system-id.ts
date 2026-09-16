import { UNKNOWN_SYSTEM_ID, universeMatches } from '../../support/universe';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid solar system ID', function () {
  queueError(404, 'Solar system not found', {
    match: universeMatches.system(UNKNOWN_SYSTEM_ID),
  });
});
