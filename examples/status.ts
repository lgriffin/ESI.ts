/**
 * ESI.ts Example: Server Status
 *
 * Quick check that the ESI API is reachable and the EVE server is online.
 * This is the simplest possible example — no parameters, no auth.
 *
 * Usage: npm run example:status
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    const status = await client.status.getStatus();
    console.log('EVE Server Status');
    console.log('-'.repeat(40));
    console.log(`  Players online: ${status.players.toLocaleString()}`);
    console.log(`  Server version: ${status.server_version}`);
    console.log(`  Start time:     ${status.start_time}`);
    if (status.vip) console.log('  VIP mode:       ACTIVE');
    console.log('\nESI is reachable and working.');
  } catch (err) {
    console.error('Failed to reach ESI:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
