/**
 * ESI.ts Example: Incursions & Faction Warfare
 *
 * Shows active Sansha incursions and faction warfare statistics.
 *
 * Usage: npm run example:incursions
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Incursions & Faction Warfare\n');

    const [incursions, fwStats, fwSystems] = await Promise.all([
      client.incursions.getIncursions(),
      client.factions.getStats(),
      client.factions.getSystems(),
    ]);

    console.log('Active Incursions');
    console.log('-'.repeat(50));
    if (incursions.length === 0) {
      console.log('  No active incursions.');
    } else {
      for (const inc of incursions) {
        console.log(`  Constellation ${inc.constellation_id}: ${inc.state} (influence: ${inc.influence.toFixed(2)})`);
        console.log(`    Staging system: ${inc.staging_solar_system_id}, Boss: ${inc.has_boss ? 'Yes' : 'No'}`);
        console.log(`    Infested systems: ${inc.infested_solar_systems?.length ?? 0}`);
      }
    }

    console.log('\nFaction Warfare Statistics');
    console.log('-'.repeat(50));
    for (const faction of fwStats.slice(0, 4)) {
      console.log(`  Faction ${faction.faction_id}:`);
      console.log(`    Pilots: ${faction.pilots}  Systems controlled: ${faction.systems_controlled}`);
      console.log(`    Kills (yesterday): ${faction.kills?.yesterday ?? 0}`);
    }

    console.log(`\nContested Systems: ${fwSystems.length}`);
    const contested = fwSystems.filter((s: any) => s.contested !== 'uncontested');
    console.log(`  Actively contested: ${contested.length}`);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
