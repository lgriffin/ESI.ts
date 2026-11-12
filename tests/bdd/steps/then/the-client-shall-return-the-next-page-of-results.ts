import { PAGE_TWO_CURSOR } from '../../support/paragon-hub';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the next page of results', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(/\/paragon-hub\/skinr\/?$/);
  expect(request.url.searchParams.get('after')).toBe(PAGE_TWO_CURSOR);
  expect(request.url.searchParams.has('before')).toBe(false);
  expect(this.result.cursor).toEqual({
    after: 'cursor-page3',
    before: 'cursor-page1',
  });
  expect(this.result.listings.map((l: any) => l.id)).toEqual([
    'd4e5f6a7-b8c9-0123-def0-456789012345',
  ]);
});
