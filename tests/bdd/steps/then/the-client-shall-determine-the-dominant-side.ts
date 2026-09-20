import { Then } from '../../support/steps';

Then('the client shall determine the dominant side', function () {
  const aggressorIsk = this.result.aggressor.isk_destroyed;
  const defenderIsk = this.result.defender.isk_destroyed;
  const aggressorKills = this.result.aggressor.ships_killed;
  const defenderKills = this.result.defender.ships_killed;

  expect(aggressorIsk).toBe(500000000000.0);
  expect(defenderIsk).toBe(200000000000.0);
  expect(aggressorKills).toBe(800);
  expect(defenderKills).toBe(300);
  expect(aggressorIsk).toBeGreaterThan(defenderIsk);
  expect(aggressorKills).toBeGreaterThan(defenderKills);

  const totalIskDestroyed = aggressorIsk + defenderIsk;
  expect(totalIskDestroyed).toBe(700000000000.0);
  expect(aggressorIsk / totalIskDestroyed).toBeCloseTo(5 / 7);
  expect(aggressorKills + defenderKills).toBe(1100);
});
