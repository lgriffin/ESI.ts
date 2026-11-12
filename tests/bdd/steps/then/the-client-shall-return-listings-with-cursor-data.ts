import { paragonHubFixtures } from '../../support/paragon-hub';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return listings with cursor data', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(/\/paragon-hub\/skinr\/?$/);
  expect(request.url.searchParams.has('after')).toBe(false);
  expect(this.result).toEqual(paragonHubFixtures.publicListings());
  expect(this.result.cursor).toEqual({
    after: 'cursor-abc',
    before: 'cursor-xyz',
  });
  expect(this.result.listings.map((l: any) => l.skinr_id)).toEqual([
    'skinr-design-001',
    'skinr-design-002',
  ]);
  expect(this.result.listings[0].price).toEqual({ isk: 500000000 });
  expect(this.result.listings[1].price).toEqual({ plex: 100 });
});
