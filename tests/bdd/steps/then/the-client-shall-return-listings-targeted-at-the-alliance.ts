import {
  TARGETED_ALLIANCE_ID,
  paragonHubFixtures,
} from '../../support/paragon-hub';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return listings targeted at the alliance', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(
    new RegExp(`/paragon-hub/skinr/alliances/${TARGETED_ALLIANCE_ID}/?$`),
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(paragonHubFixtures.allianceListings());
  expect(this.result.listings.map((l: any) => l.skinr_id)).toEqual([
    'skinr-design-004',
  ]);
});
