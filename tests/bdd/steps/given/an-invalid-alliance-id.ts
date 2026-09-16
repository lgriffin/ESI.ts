import { UNKNOWN_ALLIANCE_ID, allianceMatches } from '../../support/alliance';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid alliance ID', function () {
  queueError(404, 'Alliance not found', {
    match: allianceMatches.record(UNKNOWN_ALLIANCE_ID),
  });
});
