/**
 * ESI.ts Example: Sovereignty
 *
 * Shows active sovereignty campaigns — contested structures,
 * attack/defense scores, and event types.
 *
 * Note: The sovereignty/systems endpoint was sunset by CCP.
 * This example uses the campaigns endpoint which remains active.
 *
 * Usage: npm run example:sovereignty
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Sovereignty Campaigns\n');

    const campaigns = await client.sovereignty.getSovereigntyCampaigns();

    console.log(`Active campaigns: ${campaigns.length}\n`);

    if (campaigns.length === 0) {
      console.log('No active sovereignty campaigns at this time.');
      return;
    }

    // Group by event type
    const byType = new Map<string, number>();
    for (const c of campaigns) {
      byType.set(c.event_type, (byType.get(c.event_type) || 0) + 1);
    }

    console.log('Campaigns by Type');
    console.log('-'.repeat(50));
    for (const [type, count] of [...byType.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${type}: ${count}`);
    }

    console.log('\nRecent Campaigns (first 5)');
    console.log('-'.repeat(60));
    for (const c of campaigns.slice(0, 5)) {
      const attackPct = ((c.attackers_score ?? 0) * 100).toFixed(1);
      const defendPct = ((c.defender_score ?? 0) * 100).toFixed(1);
      console.log(
        `  System ${c.solar_system_id} | ${c.event_type}` +
          ` | Attack: ${attackPct}% | Defense: ${defendPct}%` +
          ` | Defender: ${c.defender_id}`,
      );
    }

    const raidable = await client.skyhooks.getRaidableSkyhooks();
    const open = raidable.filter((s) => s.is_raidable);
    console.log(
      `\nSkyhooks: ${raidable.length} listed, ${open.length} raidable now`,
    );
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
