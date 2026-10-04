/**
 * ESI.ts Example: Rate Limiting & Pagination
 *
 * Demonstrates rate-limiting awareness, pagination with large datasets,
 * and error handling for non-existent resources.
 *
 * Usage: npm run example:rate-limiting
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
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-rate-limit-demo',
  });

  try {
    log.info('Rate Limiting & Pagination Demo\n');

    // Test 1: Parallel requests — rate limiter keeps us within ESI limits
    log.info('1. Testing rate limiting awareness...');
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(client.universe.getRegions());
    }

    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;

    log.info(`   Made 5 parallel requests in ${elapsed}ms`);
    log.info(`   Each returned ${results[0]?.length || 0} regions\n`);

    // Test 2: Paginated endpoint — universe types is one of the largest
    log.info('2. Testing pagination with universe types...');
    const pagStart = Date.now();

    const types = await client.universe.getTypes();
    const pagElapsed = Date.now() - pagStart;

    log.info(`   Fetched ${types?.length || 0} types in ${pagElapsed}ms`);
    log.info(
      `   Average time per item: ${(pagElapsed / (types?.length || 1)).toFixed(2)}ms\n`,
    );

    // Test 3: Error handling — requesting a resource that doesn't exist
    log.info('3. Testing error handling...');
    try {
      await client.universe.getSchematicById(999999);
      log.info('   Unexpected: got a schematic that should not exist');
    } catch {
      log.info('   Correctly handled non-existent schematic error');
    }

    log.info('\nRate limiting and pagination demo completed!');
  } catch (err) {
    log.error('Demo failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
