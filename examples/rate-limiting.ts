/**
 * ESI.ts Example: Rate Limiting & Pagination
 *
 * Demonstrates rate-limiting awareness, pagination with large datasets,
 * and error handling for non-existent resources.
 *
 * Usage: npm run example:rate-limiting
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-rate-limit-demo' });

  try {
    console.log('Rate Limiting & Pagination Demo\n');

    // Test 1: Parallel requests — rate limiter keeps us within ESI limits
    console.log('1. Testing rate limiting awareness...');
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(client.universe.getRegions());
    }

    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;

    console.log(`   Made 5 parallel requests in ${elapsed}ms`);
    console.log(`   Each returned ${results[0]?.length || 0} regions\n`);

    // Test 2: Paginated endpoint — universe types is one of the largest
    console.log('2. Testing pagination with universe types...');
    const pagStart = Date.now();

    const types = await client.universe.getTypes();
    const pagElapsed = Date.now() - pagStart;

    console.log(`   Fetched ${types?.length || 0} types in ${pagElapsed}ms`);
    console.log(`   Average time per item: ${((pagElapsed) / (types?.length || 1)).toFixed(2)}ms\n`);

    // Test 3: Error handling — requesting a resource that doesn't exist
    console.log('3. Testing error handling...');
    try {
      await client.universe.getSchematicById(999999);
      console.log('   Unexpected: got a schematic that should not exist');
    } catch {
      console.log('   Correctly handled non-existent schematic error');
    }

    console.log('\nRate limiting and pagination demo completed!');
  } catch (err) {
    console.error('Error in demo:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
