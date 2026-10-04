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
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Recent Wars\n');

    const warIds = await client.wars.getWars();
    log.info(`Total war IDs returned: ${warIds.length}`);

    // Get details for the 3 most recent wars
    const recentIds = warIds.slice(0, 3);
    const wars = await Promise.all(
      recentIds.map((id: number) => client.wars.getWarById(id)),
    );

    for (const war of wars) {
      log.info('\n' + '-'.repeat(50));
      log.info(`  War ID:      ${war.id}`);
      log.info(`  Declared:    ${war.declared}`);
      log.info(`  Started:     ${war.started ?? 'Not yet'}`);
      log.info(`  Finished:    ${war.finished ?? 'Ongoing'}`);
      log.info(`  Mutual:      ${war.mutual ? 'Yes' : 'No'}`);
      log.info(
        `  Aggressor:   ${war.aggressor?.alliance_id ? 'Alliance ' + war.aggressor.alliance_id : 'Corp ' + war.aggressor?.corporation_id}`,
      );
      log.info(
        `  Defender:    ${war.defender?.alliance_id ? 'Alliance ' + war.defender.alliance_id : 'Corp ' + war.defender?.corporation_id}`,
      );
      log.info(
        `  Ships killed: ${war.aggressor?.ships_killed ?? 0} (aggressor) / ${war.defender?.ships_killed ?? 0} (defender)`,
      );
    }

    // A killmail from a long-finished war: its id and hash come from the war,
    // and the killmail itself is public once you have both.
    const WAR_WITH_KILLS = 700000;
    const warKills = await client.wars.getWarKillmails(WAR_WITH_KILLS);
    const firstKill = warKills[0];
    log.info(`\nWar ${WAR_WITH_KILLS}: ${warKills.length} killmails`);
    if (firstKill) {
      const killmail = await client.killmails.getKillmail(
        firstKill.killmail_id,
        firstKill.killmail_hash,
      );
      log.info(
        `  Killmail ${killmail.killmail_id} at ${killmail.killmail_time}: ` +
          `ship type ${killmail.victim.ship_type_id} lost in system ${killmail.solar_system_id}`,
      );
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
