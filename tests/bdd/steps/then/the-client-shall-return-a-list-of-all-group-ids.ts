import { universeFixtures, universeMatches } from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a list of all group IDs', function () {
  expect(lastRequest().url.pathname).toMatch(universeMatches.groups());
  expect(this.result).toEqual(universeFixtures.groupIndex());
  expect(this.result.every((id: unknown) => typeof id === 'number')).toBe(true);
});
