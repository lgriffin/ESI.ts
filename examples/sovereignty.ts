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
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Sovereignty Campaigns\n');

    const campaigns = await client.sovereignty.getSovereigntyCampaigns();

    log.info(`Active campaigns: ${campaigns.length}\n`);

    if (campaigns.length === 0) {
      log.info('No active sovereignty campaigns at this time.');
      return;
    }

    // Group by event type
    const byType = new Map<string, number>();
    for (const c of campaigns) {
      byType.set(c.event_type, (byType.get(c.event_type) || 0) + 1);
    }

    log.info('Campaigns by Type');
    log.info('-'.repeat(50));
    for (const [type, count] of [...byType.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      log.info(`  ${type}: ${count}`);
    }

    log.info('\nRecent Campaigns (first 5)');
    log.info('-'.repeat(60));
    for (const c of campaigns.slice(0, 5)) {
      const attackPct = ((c.attackers_score ?? 0) * 100).toFixed(1);
      const defendPct = ((c.defender_score ?? 0) * 100).toFixed(1);
      log.info(
        `  System ${c.solar_system_id} | ${c.event_type}` +
          ` | Attack: ${attackPct}% | Defense: ${defendPct}%` +
          ` | Defender: ${c.defender_id}`,
      );
    }

    const { skyhooks } = await client.skyhooks.getRaidableSkyhooks();
    const now = Date.now();
    const open = skyhooks.filter(
      (s) =>
        Date.parse(s.theft_vulnerability.start) <= now &&
        now < Date.parse(s.theft_vulnerability.end),
    );
    log.info(
      `\nSkyhooks: ${skyhooks.length} with a theft window, ${open.length} open now`,
    );
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
