/**
 * ESI.ts Example: Server Status
 *
 * Quick check that the ESI API is reachable and the EVE server is online.
 * This is the simplest possible example — no parameters, no auth.
 *
 * Usage: npm run example:status
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
    const status = await client.status.getStatus();
    log.info('EVE Server Status');
    log.info('-'.repeat(40));
    log.info(`  Players online: ${status.players.toLocaleString()}`);
    log.info(`  Server version: ${status.server_version}`);
    log.info(`  Start time:     ${status.start_time}`);
    if (status.vip) log.info('  VIP mode:       ACTIVE');
    log.info('\nESI is reachable and working.');
  } catch (err) {
    log.error('Failed to reach ESI', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
