import {
  MINERAL_GROUP_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return group details and contained types', function () {
  expect(lastRequest().url.pathname).toMatch(
    universeMatches.group(MINERAL_GROUP_ID),
  );
  expect(this.result).toEqual(universeFixtures.mineralGroup());
  expect(this.result.name).toBe('Mineral');
  expect(this.result.category_id).toBe(4);
  expect(this.result.types).toEqual([34, 35, 36, 37, 38, 39, 40, 11399]);
});
