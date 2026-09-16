import { UNKNOWN_WAR_ID, warMatches } from '../../support/wars';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid war ID for killmails', function () {
  queueError(404, 'War not found', {
    match: warMatches.killmails(UNKNOWN_WAR_ID),
  });
});
