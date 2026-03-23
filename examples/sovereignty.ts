/**
 * ESI.ts Example: Sovereignty
 *
 * Shows current sovereignty map data — who owns nullsec systems.
 *
 * Usage: npm run example:sovereignty
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Sovereignty Overview\n');

    const [sovMap, campaigns] = await Promise.all([
      client.sovereignty.getSovereigntyMap(),
      client.sovereignty.getSovereigntyCampaigns(),
    ]);

    // Count systems by alliance
    const allianceSystems = new Map<number, number>();
    for (const system of sovMap) {
      if (system.alliance_id) {
        allianceSystems.set(system.alliance_id, (allianceSystems.get(system.alliance_id) || 0) + 1);
      }
    }

    // Sort by system count, show top 10
    const sorted = [...allianceSystems.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    console.log('Top 10 Alliances by Sovereign Systems');
    console.log('-'.repeat(45));
    console.log('  Alliance ID       Systems');
    for (const [allianceId, count] of sorted) {
      console.log(`  ${String(allianceId).padEnd(18)} ${count}`);
    }

    console.log(`\nTotal sovereign systems: ${sovMap.filter((s: any) => s.alliance_id).length}`);
    console.log(`Active campaigns:       ${campaigns.length}`);

    if (campaigns.length > 0) {
      console.log('\nActive Campaigns (first 3)');
      console.log('-'.repeat(45));
      for (const c of campaigns.slice(0, 3)) {
        console.log(`  System ${c.solar_system_id} - Type: ${c.event_type} - Progress: ${((c.attackers_score ?? 0) * 100).toFixed(1)}%`);
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
