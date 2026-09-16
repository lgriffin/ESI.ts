import { EMPTY_WAR_ID, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a war with no killmails exists', function () {
  queueResponse({ match: warMatches.killmails(EMPTY_WAR_ID), body: [] });
});
