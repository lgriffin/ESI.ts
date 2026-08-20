/**
 * ESI.ts Example: Skyhooks & Sovereignty Hubs
 *
 * Queries Upwell sovereignty structures — sovereignty hubs,
 * orbital skyhooks with silo levels, and currently raidable skyhooks.
 *
 * Note: Sovereignty hub and skyhook endpoints require authentication.
 * The raidable skyhooks endpoint is public. Some endpoints may return 404
 * if CCP has not yet deployed skyhook content to the current server version.
 *
 * Usage: npm run example:skyhooks
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';

async function main() {
  const client = new EsiClient();

  // Corporation ID to query sovereignty structures for
  const corporationId = parseInt(process.env.CORPORATION_ID || '0', 10);
  if (!corporationId) {
    console.error(
      'Set CORPORATION_ID environment variable to your corporation ID.',
    );
    process.exit(1);
  }

  try {
    console.log('Skyhooks & Sovereignty Hubs\n');

    let hubs: Awaited<ReturnType<typeof client.skyhooks.getSovereigntyHubs>>;
    let skyhooks: Awaited<
      ReturnType<typeof client.skyhooks.getOrbitalSkyhooks>
    >;
    let raidable: Awaited<
      ReturnType<typeof client.skyhooks.getRaidableSkyhooks>
    >;

    try {
      [hubs, skyhooks, raidable] = await Promise.all([
        client.skyhooks.getSovereigntyHubs(corporationId),
        client.skyhooks.getOrbitalSkyhooks(corporationId),
        client.skyhooks.getRaidableSkyhooks(),
      ]);
    } catch (err) {
      if (isNotFound(err)) {
        console.log(
          'Skyhook endpoints are not currently available on this ESI version.',
        );
        console.log(
          'These endpoints may be deployed in a future EVE Online patch.',
        );
        return;
      }
      throw err;
    }

    console.log('Sovereignty Hubs');
    console.log('-'.repeat(60));
    const onlineHubs = hubs.filter((h) => h.online);
    console.log(`  Total: ${hubs.length}   Online: ${onlineHubs.length}`);
    for (const hub of hubs.slice(0, 5)) {
      const upgrades = hub.installed_upgrades?.length ?? 0;
      console.log(
        `  System ${hub.system_id} — Corp ${hub.corporation_id} — ` +
          `${hub.online ? 'Online' : 'Offline'} — ${upgrades} upgrade(s)`,
      );
    }
    if (hubs.length > 5) console.log(`  ... and ${hubs.length - 5} more`);

    console.log('\nOrbital Skyhooks');
    console.log('-'.repeat(60));
    console.log(`  Total: ${skyhooks.length}`);
    for (const sk of skyhooks.slice(0, 5)) {
      const fill =
        sk.reagent_silo_capacity && sk.reagent_silo_level
          ? `${((sk.reagent_silo_level / sk.reagent_silo_capacity) * 100).toFixed(0)}% full`
          : 'N/A';
      console.log(
        `  System ${sk.system_id} — Corp ${sk.corporation_id} — Silo: ${fill}`,
      );
    }
    if (skyhooks.length > 5)
      console.log(`  ... and ${skyhooks.length - 5} more`);

    console.log('\nRaidable Skyhooks');
    console.log('-'.repeat(60));
    const nowRaidable = raidable.filter((r) => r.is_raidable);
    const upcoming = raidable.filter((r) => !r.is_raidable && r.raidable_at);
    console.log(`  Currently raidable: ${nowRaidable.length}`);
    console.log(`  Becoming raidable:  ${upcoming.length}`);

    for (const r of nowRaidable.slice(0, 5)) {
      console.log(`  System ${r.system_id} — RAIDABLE NOW`);
    }
    for (const r of upcoming.slice(0, 3)) {
      console.log(`  System ${r.system_id} — Raidable at ${r.raidable_at}`);
    }

    // Fetch detail for the first skyhook
    if (skyhooks.length > 0) {
      console.log('\nSkyhook Detail');
      console.log('-'.repeat(60));
      const detail = await client.skyhooks.getSkyhookDetail(
        corporationId,
        skyhooks[0].structure_id,
      );
      console.log(
        `  Skyhook ${detail.id} — Planet ${detail.planet_id} — State: ${detail.state}`,
      );
      console.log(
        `  Active: ${detail.is_active} — Workforce: ${detail.effective_workforce ?? 'N/A'}`,
      );
      if (detail.reagents?.length) {
        for (const r of detail.reagents) {
          console.log(
            `  Reagent ${r.type_id}: Secured ${r.secured_stock} / Unsecured ${r.unsecured_stock}`,
          );
        }
      }
      if (detail.theft_vulnerability) {
        console.log(
          `  Theft window: ${detail.theft_vulnerability.start} — ${detail.theft_vulnerability.end}`,
        );
      }
    }

    // Fetch detail for the first sovereignty hub
    if (hubs.length > 0) {
      console.log('\nSovereignty Hub Detail');
      console.log('-'.repeat(60));
      const hubDetail = await client.skyhooks.getSovereigntyHubDetail(
        corporationId,
        hubs[0].structure_id,
      );
      console.log(
        `  Hub ${hubDetail.id} — System ${hubDetail.solar_system_id}`,
      );
      console.log(`  Upgrades: ${hubDetail.upgrades.length}`);
      for (const u of hubDetail.upgrades.slice(0, 5)) {
        console.log(`    Type ${u.type_id} — ${u.power_state}`);
      }
      console.log(
        `  Reagent bay last updated: ${hubDetail.reagent_bay.last_updated}`,
      );
      if (hubDetail.vulnerability_window) {
        console.log(
          `  Vulnerability: ${hubDetail.vulnerability_window.start} — ${hubDetail.vulnerability_window.end}`,
        );
      }
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
