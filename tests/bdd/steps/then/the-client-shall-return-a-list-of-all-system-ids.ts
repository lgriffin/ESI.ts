import { universeFixtures, universeMatches } from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a list of all system IDs', function () {
  expect(lastRequest().url.pathname).toMatch(universeMatches.systems());
  expect(this.result).toEqual(universeFixtures.systemIndex());
  expect(this.result.every((id: unknown) => typeof id === 'number')).toBe(true);
});
