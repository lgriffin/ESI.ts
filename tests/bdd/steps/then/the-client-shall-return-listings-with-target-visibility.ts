import {
  LISTING_CHARACTER_ID,
  paragonHubFixtures,
} from '../../support/paragon-hub';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return listings with target visibility', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(
    new RegExp(`/characters/${LISTING_CHARACTER_ID}/paragon-hub/skinr/?$`),
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual(paragonHubFixtures.characterListings());
  expect(this.result.listings).toHaveLength(1);
  expect(this.result.listings[0].seller_id).toBe(LISTING_CHARACTER_ID);
  expect(this.result.listings[0].target).toEqual({ public: true });
});
