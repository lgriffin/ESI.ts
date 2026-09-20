import { MULTI_ATTACKER_KILLMAIL } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client analyzes the attackers', async function () {
  const killmail = await this.client.killmails.getKillmail(
    MULTI_ATTACKER_KILLMAIL.id,
    MULTI_ATTACKER_KILLMAIL.hash,
  );
  this.result = killmail;
  this.values.finalBlowAttacker = killmail.attackers.find(
    (attacker) => attacker.final_blow,
  );
  this.values.totalDamage = killmail.attackers.reduce(
    (sum, attacker) => sum + attacker.damage_done,
    0,
  );
});
