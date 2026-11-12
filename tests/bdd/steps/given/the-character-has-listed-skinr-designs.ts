import {
  LISTING_CHARACTER_ID,
  paragonHubFixtures,
  paragonHubPaths,
} from '../../support/paragon-hub';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the character has listed SKINR designs', function () {
  queueResponse({
    match: paragonHubPaths.characterListings(LISTING_CHARACTER_ID),
    body: paragonHubFixtures.characterListings(),
  });
});
