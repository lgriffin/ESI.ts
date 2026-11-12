import {
  TARGETED_ALLIANCE_ID,
  paragonHubFixtures,
  paragonHubPaths,
} from '../../support/paragon-hub';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('alliance-targeted SKINR listings exist', function () {
  queueResponse({
    match: paragonHubPaths.allianceListings(TARGETED_ALLIANCE_ID),
    body: paragonHubFixtures.allianceListings(),
  });
});
