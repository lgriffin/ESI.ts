/**
 * ESI.ts Example: Wars
 *
 * Fetches recent wars and shows details for the most recent one.
 *
 * Usage: npm run example:wars
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Recent Wars\n');

    const warIds = await client.wars.getWars();
    console.log(`Total war IDs returned: ${warIds.length}`);

    // Get details for the 3 most recent wars
    const recentIds = warIds.slice(0, 3);
    const wars = await Promise.all(
      recentIds.map((id: number) => client.wars.getWarById(id)),
    );

    for (const war of wars) {
      console.log('\n' + '-'.repeat(50));
      console.log(`  War ID:      ${war.id}`);
      console.log(`  Declared:    ${war.declared}`);
      console.log(`  Started:     ${war.started ?? 'Not yet'}`);
      console.log(`  Finished:    ${war.finished ?? 'Ongoing'}`);
      console.log(`  Mutual:      ${war.mutual ? 'Yes' : 'No'}`);
      console.log(
        `  Aggressor:   ${war.aggressor?.alliance_id ? 'Alliance ' + war.aggressor.alliance_id : 'Corp ' + war.aggressor?.corporation_id}`,
      );
      console.log(
        `  Defender:    ${war.defender?.alliance_id ? 'Alliance ' + war.defender.alliance_id : 'Corp ' + war.defender?.corporation_id}`,
      );
      console.log(
        `  Ships killed: ${war.aggressor?.ships_killed ?? 0} (aggressor) / ${war.defender?.ships_killed ?? 0} (defender)`,
      );
    }

    // A killmail from a long-finished war: its id and hash come from the war,
    // and the killmail itself is public once you have both.
    const WAR_WITH_KILLS = 700000;
    const warKills = await client.wars.getWarKillmails(WAR_WITH_KILLS);
    const firstKill = warKills[0];
    console.log(`\nWar ${WAR_WITH_KILLS}: ${warKills.length} killmails`);
    if (firstKill) {
      const killmail = await client.killmails.getKillmail(
        firstKill.killmail_id,
        firstKill.killmail_hash,
      );
      console.log(
        `  Killmail ${killmail.killmail_id} at ${killmail.killmail_time}: ` +
          `ship type ${killmail.victim.ship_type_id} lost in system ${killmail.solar_system_id}`,
      );
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
