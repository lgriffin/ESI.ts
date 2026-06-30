/**
 * ESI.ts Example: Mercenary Dens & Tactical Operations
 *
 * Fetches mercenary dens across New Eden and their spawned
 * tactical operations (MTOs), showing development and anarchy levels.
 *
 * Note: These endpoints may return 404 if CCP has not yet deployed
 * mercenary content to the current server version.
 *
 * Usage: npm run example:mercenary
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Mercenary Dens & Tactical Operations\n');

    let dens: Awaited<ReturnType<typeof client.mercenary.getMercenaryDens>>;
    let operations: Awaited<ReturnType<typeof client.mercenary.getMercenaryTacticalOperations>>;

    try {
      [dens, operations] = await Promise.all([
        client.mercenary.getMercenaryDens(),
        client.mercenary.getMercenaryTacticalOperations(),
      ]);
    } catch (err) {
      if (isNotFound(err)) {
        console.log('Mercenary endpoints are not currently available on this ESI version.');
        console.log('These endpoints may be deployed in a future EVE Online patch.');
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

    console.log('Mercenary Dens by Region');
    console.log('-'.repeat(60));
    const sortedRegions = [...byRegion.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [regionId, regionDens] of sortedRegions.slice(0, 10)) {
      const avgDev =
        regionDens.reduce((sum, d) => sum + (d.development_level ?? 0), 0) / regionDens.length;
      const avgAnarchy =
        regionDens.reduce((sum, d) => sum + (d.anarchy_level ?? 0), 0) / regionDens.length;
      console.log(
        `  Region ${regionId}: ${regionDens.length} den(s) — ` +
          `Avg Dev: ${avgDev.toFixed(1)} — Avg Anarchy: ${avgAnarchy.toFixed(1)}`,
      );
    }
    if (sortedRegions.length > 10) console.log(`  ... and ${sortedRegions.length - 10} more`);

    console.log(`\nTactical Operations (${operations.length} total)`);
    console.log('-'.repeat(60));

    const byStatus = new Map<string, number>();
    for (const op of operations) {
      byStatus.set(op.status, (byStatus.get(op.status) || 0) + 1);
    }
    for (const [status, count] of byStatus) {
      console.log(`  ${status.padEnd(12)} ${count}`);
    }

    const active = operations.filter(op => op.status === 'active');
    if (active.length > 0) {
      console.log('\nActive Operations (first 5)');
      console.log('-'.repeat(60));
      for (const op of active.slice(0, 5)) {
        const expires = op.expires_at ? ` — Expires: ${op.expires_at}` : '';
        console.log(`  Den ${op.den_id} → System ${op.system_id} — ${op.site_type}${expires}`);
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
