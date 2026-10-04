/**
 * ESI.ts Example: Mercenary Dens & Tactical Operations
 *
 * Fetches mercenary dens across New Eden and their spawned
 * tactical operations (MTOs), showing development and anarchy levels.
 *
 * Note: These endpoints require authentication and may return 404 if CCP
 * has not yet deployed mercenary content to the current server version.
 *
 * Usage: npm run example:mercenary
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

  // Character ID to query mercenary data for
  const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);
  if (!characterId) {
    log.error('Set CHARACTER_ID environment variable to your character ID.');
    process.exit(1);
  }

  try {
    log.info('Mercenary Dens & Tactical Operations\n');

    let dens: Awaited<ReturnType<typeof client.mercenary.getMercenaryDens>>;
    let operations: Awaited<
      ReturnType<typeof client.mercenary.getMercenaryTacticalOperations>
    >;

    try {
      [dens, operations] = await Promise.all([
        client.mercenary.getMercenaryDens(characterId),
        client.mercenary.getMercenaryTacticalOperations(characterId),
      ]);
    } catch (err) {
      if (isNotFound(err)) {
        log.info(
          'Mercenary endpoints are not currently available on this ESI version.',
        );
        log.info(
          'These endpoints may be deployed in a future EVE Online patch.',
        );
        return;
      }
      throw err;
    }

    const byRegion = new Map<number, typeof dens>();
    for (const den of dens) {
      const list = byRegion.get(den.region_id) || [];
      list.push(den);
      byRegion.set(den.region_id, list);
    }

    log.info('Mercenary Dens by Region');
    log.info('-'.repeat(60));
    const sortedRegions = [...byRegion.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    );

    for (const [regionId, regionDens] of sortedRegions.slice(0, 10)) {
      const avgDev =
        regionDens.reduce((sum, d) => sum + (d.development_level ?? 0), 0) /
        regionDens.length;
      const avgAnarchy =
        regionDens.reduce((sum, d) => sum + (d.anarchy_level ?? 0), 0) /
        regionDens.length;
      log.info(
        `  Region ${regionId}: ${regionDens.length} den(s) — ` +
          `Avg Dev: ${avgDev.toFixed(1)} — Avg Anarchy: ${avgAnarchy.toFixed(1)}`,
      );
    }
    if (sortedRegions.length > 10)
      log.info(`  ... and ${sortedRegions.length - 10} more`);

    log.info(`\nTactical Operations (${operations.length} total)`);
    log.info('-'.repeat(60));

    const byStatus = new Map<string, number>();
    for (const op of operations) {
      byStatus.set(op.status, (byStatus.get(op.status) || 0) + 1);
    }
    for (const [status, count] of byStatus) {
      log.info(`  ${status.padEnd(12)} ${count}`);
    }

    const active = operations.filter((op) => op.status === 'active');
    if (active.length > 0) {
      log.info('\nActive Operations (first 5)');
      log.info('-'.repeat(60));
      for (const op of active.slice(0, 5)) {
        const expires = op.expires_at ? ` — Expires: ${op.expires_at}` : '';
        log.info(
          `  Den ${op.den_id} → System ${op.system_id} — ${op.site_type}${expires}`,
        );
      }
    }

    // Fetch detail for the first den
    const firstDens = dens[0];
    if (firstDens) {
      log.info('\nMercenary Den Detail');
      log.info('-'.repeat(60));
      const denDetail = await client.mercenary.getMercenaryDenDetail(
        characterId,
        firstDens.den_id,
      );
      log.info(`  Den ${denDetail.id} — State: ${denDetail.state}`);
      log.info(
        `  Skyhook: Planet ${denDetail.skyhook.planet_id} (Corp ${denDetail.skyhook.corporation_id})`,
      );
      log.info(`  Infomorphs: ${denDetail.infomorphs.amount}`);
      log.info(
        `  Evolution: Dev ${denDetail.evolution.development.level ?? 'N/A'} / ` +
          `Anarchy ${denDetail.evolution.anarchy.level ?? 'N/A'}`,
      );
    }

    // Fetch detail for the first operation
    const firstOperations = operations[0];
    if (firstOperations) {
      log.info('\nMTO Detail');
      log.info('-'.repeat(60));
      const opDetail =
        await client.mercenary.getMercenaryTacticalOperationDetail(
          characterId,
          String(firstOperations.operation_id),
        );
      log.info(`  Operation ${opDetail.id} — State: ${opDetail.state}`);
      log.info(`  Dungeon Type: ${opDetail.dungeon_type_id}`);
      log.info(`  Expires: ${opDetail.expires}`);
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
