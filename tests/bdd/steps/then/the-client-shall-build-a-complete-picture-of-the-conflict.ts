import { ACTIVE_WAR_ID, warPaths } from '../../support/wars';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall build a complete picture of the conflict', function () {
  const { details, killmails } = this.values;
  expect(
    sentRequests()
      .map((r) => r.url.pathname)
      .sort(),
  ).toEqual([warPaths.war(ACTIVE_WAR_ID), warPaths.killmails(ACTIVE_WAR_ID)]);

  expect(details.id).toBe(700001);
  expect(details.open_for_allies).toBe(true);
  expect(details).not.toHaveProperty('finished');
  expect(details.aggressor.ships_killed + details.defender.ships_killed).toBe(
    370,
  );

  expect(killmails).toEqual([
    { killmail_id: 90000001, killmail_hash: 'abc123' },
    { killmail_id: 90000002, killmail_hash: 'def456' },
  ]);
});
