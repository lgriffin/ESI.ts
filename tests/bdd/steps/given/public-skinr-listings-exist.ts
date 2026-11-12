import { paragonHubFixtures, paragonHubPaths } from '../../support/paragon-hub';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('public SKINR listings exist', function () {
  queueResponse({
    match: paragonHubPaths.publicListings,
    body: paragonHubFixtures.publicListings(),
  });
});
