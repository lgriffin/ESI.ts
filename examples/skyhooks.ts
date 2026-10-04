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
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  // Corporation ID to query sovereignty structures for
  const corporationId = parseInt(process.env.CORPORATION_ID || '0', 10);
  if (!corporationId) {
    log.error(
      'Set CORPORATION_ID environment variable to your corporation ID.',
    );
    process.exit(1);
  }

  try {
    log.info('Skyhooks & Sovereignty Hubs\n');

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
        log.info(
          'Skyhook endpoints are not currently available on this ESI version.',
        );
        log.info(
          'These endpoints may be deployed in a future EVE Online patch.',
        );
        return;
      }
      throw err;
    }

    log.info('Sovereignty Hubs');
    log.info('-'.repeat(60));
    const onlineHubs = hubs.filter((h) => h.online);
    log.info(`  Total: ${hubs.length}   Online: ${onlineHubs.length}`);
    for (const hub of hubs.slice(0, 5)) {
      const upgrades = hub.installed_upgrades?.length ?? 0;
      log.info(
        `  System ${hub.system_id} — Corp ${hub.corporation_id} — ` +
          `${hub.online ? 'Online' : 'Offline'} — ${upgrades} upgrade(s)`,
      );
    }
    if (hubs.length > 5) log.info(`  ... and ${hubs.length - 5} more`);

    log.info('\nOrbital Skyhooks');
    log.info('-'.repeat(60));
    log.info(`  Total: ${skyhooks.length}`);
    for (const sk of skyhooks.slice(0, 5)) {
      const fill =
        sk.reagent_silo_capacity && sk.reagent_silo_level
          ? `${((sk.reagent_silo_level / sk.reagent_silo_capacity) * 100).toFixed(0)}% full`
          : 'N/A';
      log.info(
        `  System ${sk.system_id} — Corp ${sk.corporation_id} — Silo: ${fill}`,
      );
    }
    if (skyhooks.length > 5) log.info(`  ... and ${skyhooks.length - 5} more`);

    log.info('\nRaidable Skyhooks');
    log.info('-'.repeat(60));
    // A skyhook is open to theft between its window's start and end.
    const now = Date.now();
    const windows = raidable.skyhooks.map((r) => ({
      ...r,
      start: Date.parse(r.theft_vulnerability.start),
      end: Date.parse(r.theft_vulnerability.end),
    }));
    const nowRaidable = windows.filter((r) => r.start <= now && now < r.end);
    const upcoming = windows.filter((r) => r.start > now);
    log.info(`  Currently raidable: ${nowRaidable.length}`);
    log.info(`  Becoming raidable:  ${upcoming.length}`);

    for (const r of nowRaidable.slice(0, 5)) {
      log.info(
        `  Planet ${r.planet_id} (system ${r.solar_system_id}) — RAIDABLE until ${r.theft_vulnerability.end}`,
      );
    }
    for (const r of upcoming.slice(0, 3)) {
      log.info(
        `  Planet ${r.planet_id} (system ${r.solar_system_id}) — raidable from ${r.theft_vulnerability.start}`,
      );
    }

    // Fetch detail for the first skyhook
    const firstSkyhooks = skyhooks[0];
    if (firstSkyhooks) {
      log.info('\nSkyhook Detail');
      log.info('-'.repeat(60));
      const detail = await client.skyhooks.getSkyhookDetail(
        corporationId,
        firstSkyhooks.structure_id,
      );
      log.info(
        `  Skyhook ${detail.id} — Planet ${detail.planet_id} — State: ${detail.state}`,
      );
      log.info(
        `  Active: ${detail.is_active} — Workforce: ${detail.effective_workforce ?? 'N/A'}`,
      );
      if (detail.reagents?.length) {
        for (const r of detail.reagents) {
          log.info(
            `  Reagent ${r.type_id}: Secured ${r.secured_stock} / Unsecured ${r.unsecured_stock}`,
          );
        }
      }
      if (detail.theft_vulnerability) {
        log.info(
          `  Theft window: ${detail.theft_vulnerability.start} — ${detail.theft_vulnerability.end}`,
        );
      }
    }

    // Fetch detail for the first sovereignty hub
    const firstHubs = hubs[0];
    if (firstHubs) {
      log.info('\nSovereignty Hub Detail');
      log.info('-'.repeat(60));
      const hubDetail = await client.skyhooks.getSovereigntyHubDetail(
        corporationId,
        firstHubs.structure_id,
      );
      log.info(`  Hub ${hubDetail.id} — System ${hubDetail.solar_system_id}`);
      log.info(`  Upgrades: ${hubDetail.upgrades.length}`);
      for (const u of hubDetail.upgrades.slice(0, 5)) {
        log.info(`    Type ${u.type_id} — ${u.power_state}`);
      }
      log.info(
        `  Reagent bay last updated: ${hubDetail.reagent_bay.last_updated}`,
      );
      if (hubDetail.vulnerability_window) {
        log.info(
          `  Vulnerability: ${hubDetail.vulnerability_window.start} — ${hubDetail.vulnerability_window.end}`,
        );
      }
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
