/**
 * ESI.ts Example: Sovereignty
 *
 * Shows current sovereignty data — who owns nullsec systems,
 * ADM indices, active campaigns, and raidable skyhooks.
 *
 * Usage: npm run example:sovereignty
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Sovereignty Overview\n');

    const [systems, campaigns] = await Promise.all([
      client.sovereignty.getSovereigntySystems(),
      client.sovereignty.getSovereigntyCampaigns(),
    ]);

    // Count systems by alliance
    const allianceSystems = new Map<number, number>();
    for (const system of systems) {
      if (system.alliance_id) {
        allianceSystems.set(system.alliance_id, (allianceSystems.get(system.alliance_id) || 0) + 1);
      }
    }

    // Sort by system count, show top 10
    const sorted = [...allianceSystems.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    console.log('Top 10 Alliances by Sovereign Systems');
    console.log('-'.repeat(60));
    console.log('  Alliance ID       Systems    Avg Military ADM');
    for (const [allianceId, count] of sorted) {
      const allianceSysData = systems.filter(s => s.alliance_id === allianceId);
      const avgMilitary = allianceSysData.reduce((sum, s) => sum + (s.military_index ?? 0), 0) / allianceSysData.length;
      console.log(`  ${String(allianceId).padEnd(18)} ${String(count).padEnd(10)} ${avgMilitary.toFixed(1)}`);
    }

    console.log(`\nTotal sovereign systems: ${systems.filter(s => s.alliance_id).length}`);
    console.log(`Active campaigns:       ${campaigns.length}`);

    if (campaigns.length > 0) {
      console.log('\nActive Campaigns (first 3)');
      console.log('-'.repeat(60));
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
