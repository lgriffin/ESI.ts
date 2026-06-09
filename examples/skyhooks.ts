/**
 * ESI.ts Example: Skyhooks & Sovereignty Hubs
 *
 * Queries Upwell sovereignty structures — sovereignty hubs,
 * orbital skyhooks with silo levels, and currently raidable skyhooks.
 *
 * Usage: npm run example:skyhooks
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Skyhooks & Sovereignty Hubs\n');

    const [hubs, skyhooks, raidable] = await Promise.all([
      client.skyhooks.getSovereigntyHubs(),
      client.skyhooks.getOrbitalSkyhooks(),
      client.skyhooks.getRaidableSkyhooks(),
    ]);

    // Sovereignty hubs overview
    console.log('Sovereignty Hubs');
    console.log('-'.repeat(60));
    const onlineHubs = hubs.filter(h => h.online);
    console.log(`  Total: ${hubs.length}   Online: ${onlineHubs.length}`);
    for (const hub of hubs.slice(0, 5)) {
      const upgrades = hub.installed_upgrades?.length ?? 0;
      console.log(
        `  System ${hub.system_id} — Corp ${hub.corporation_id} — ` +
          `${hub.online ? 'Online' : 'Offline'} — ${upgrades} upgrade(s)`,
      );
    }
    if (hubs.length > 5) console.log(`  ... and ${hubs.length - 5} more`);

    // Orbital skyhooks with silo status
    console.log('\nOrbital Skyhooks');
    console.log('-'.repeat(60));
    console.log(`  Total: ${skyhooks.length}`);
    for (const sk of skyhooks.slice(0, 5)) {
      const fill =
        sk.reagent_silo_capacity && sk.reagent_silo_level
          ? `${((sk.reagent_silo_level / sk.reagent_silo_capacity) * 100).toFixed(0)}% full`
          : 'N/A';
      console.log(`  System ${sk.system_id} — Corp ${sk.corporation_id} — Silo: ${fill}`);
    }
    if (skyhooks.length > 5) console.log(`  ... and ${skyhooks.length - 5} more`);

    // Raidable skyhooks
    console.log('\nRaidable Skyhooks');
    console.log('-'.repeat(60));
    const nowRaidable = raidable.filter(r => r.is_raidable);
    const upcoming = raidable.filter(r => !r.is_raidable && r.raidable_at);
    console.log(`  Currently raidable: ${nowRaidable.length}`);
    console.log(`  Becoming raidable:  ${upcoming.length}`);

    for (const r of nowRaidable.slice(0, 5)) {
      console.log(`  System ${r.system_id} — RAIDABLE NOW`);
    }
    for (const r of upcoming.slice(0, 3)) {
      console.log(`  System ${r.system_id} — Raidable at ${r.raidable_at}`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
