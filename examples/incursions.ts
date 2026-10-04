/**
 * ESI.ts Example: Incursions & Faction Warfare
 *
 * Shows active Sansha incursions and faction warfare statistics.
 *
 * Usage: npm run example:incursions
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
    log.info('Incursions & Faction Warfare\n');

    const [incursions, fwStats, fwSystems] = await Promise.all([
      client.incursions.getIncursions(),
      client.factions.getStats(),
      client.factions.getSystems(),
    ]);

    log.info('Active Incursions');
    log.info('-'.repeat(50));
    if (incursions.length === 0) {
      log.info('  No active incursions.');
    } else {
      for (const inc of incursions) {
        log.info(
          `  Constellation ${inc.constellation_id}: ${inc.state} (influence: ${inc.influence.toFixed(2)})`,
        );
        log.info(
          `    Staging system: ${inc.staging_solar_system_id}, Boss: ${inc.has_boss ? 'Yes' : 'No'}`,
        );
        log.info(
          `    Infested systems: ${inc.infested_solar_systems?.length ?? 0}`,
        );
      }
    }

    log.info('\nFaction Warfare Statistics');
    log.info('-'.repeat(50));
    for (const faction of fwStats.slice(0, 4)) {
      log.info(`  Faction ${faction.faction_id}:`);
      log.info(
        `    Pilots: ${faction.pilots}  Systems controlled: ${faction.systems_controlled}`,
      );
      log.info(`    Kills (yesterday): ${faction.kills?.yesterday ?? 0}`);
    }

    log.info(`\nContested Systems: ${fwSystems.length}`);
    const contested = fwSystems.filter(
      (s: any) => s.contested !== 'uncontested',
    );
    log.info(`  Actively contested: ${contested.length}`);
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
