import { Then } from '../../support/steps';

Then('I shall identify the final blow dealer and total damage', function () {
  expect(
    this.result.attackers.map((a: any) => [
      a.character_id,
      a.damage_done,
      a.final_blow,
    ]),
  ).toEqual([
    [1689391488, 8000, false],
    [123456789, 5500, false],
    [111111111, 2100, true],
  ]);
  expect(this.values.finalBlowAttacker.character_id).toBe(111111111);
  expect(this.values.totalDamage).toBe(15600);
  expect(this.values.totalDamage).toBe(this.result.victim.damage_taken);
});
