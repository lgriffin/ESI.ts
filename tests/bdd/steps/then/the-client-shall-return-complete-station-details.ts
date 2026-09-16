import {
  JITA_STATION_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete station details', function () {
  expect(lastRequest().url.pathname).toMatch(
    universeMatches.station(JITA_STATION_ID),
  );
  expect(this.result).toEqual(universeFixtures.jitaStation());
  expect(this.result.name).toBe(
    'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
  );
  expect(this.result.system_id).toBe(30000142);
  expect(this.result.services).toEqual([
    'bounty-missions',
    'courier-missions',
    'interbus',
    'reprocessing-plant',
    'market',
    'stock-exchange',
  ]);
  expect(this.result.max_dockable_ship_volume).toBe(50000000);
});
