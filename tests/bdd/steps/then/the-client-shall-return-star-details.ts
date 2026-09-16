import {
  JITA_STAR_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return star details', function () {
  expect(lastRequest().url.pathname).toMatch(
    universeMatches.star(JITA_STAR_ID),
  );
  expect(this.result).toEqual(universeFixtures.jitaStar());
  expect(this.result.name).toBe('Jita - Star');
  expect(this.result.solar_system_id).toBe(30000142);
  expect(this.result.spectral_class).toBe('K2 V');
  expect(this.result.temperature).toBe(4567);
  expect(this.result.radius).toBe(62140000);
});
