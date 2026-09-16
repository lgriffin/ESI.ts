import { ACTIVE_WAR_ID, warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete war information', function () {
  expect(lastRequest().url.pathname).toBe(warPaths.war(ACTIVE_WAR_ID));
  expect(lastRequest().headers.authorization).toBeUndefined();
  expect(this.result.id).toBe(700001);
  expect(this.result.aggressor).toEqual({
    alliance_id: 99005338,
    isk_destroyed: 150000000000.0,
    ships_killed: 250,
  });
  expect(this.result.defender).toEqual({
    alliance_id: 99000001,
    isk_destroyed: 75000000000.0,
    ships_killed: 120,
  });
  expect(this.result.declared).toBe('2024-01-10T00:00:00Z');
  expect(this.result.started).toBe('2024-01-11T00:00:00Z');
  expect(this.result).not.toHaveProperty('finished');
});
