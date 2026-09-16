import {
  TRITANIUM_TYPE_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete item details', function () {
  expect(lastRequest().url.pathname).toMatch(
    universeMatches.type(TRITANIUM_TYPE_ID),
  );
  expect(this.result).toEqual(universeFixtures.tritanium());
  expect(this.result.name).toBe('Tritanium');
  expect(this.result.description).toBe(
    'The most common ore type in the known universe.',
  );
  expect(this.result.group_id).toBe(18);
  expect(this.result.volume).toBe(0.01);
  expect(this.result.published).toBe(true);
});
