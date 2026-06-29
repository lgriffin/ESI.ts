/**
 * ESI.ts Example: Retry, Timeout & Response Metadata
 *
 * Demonstrates retry with exponential backoff, request timeouts,
 * TimeoutError handling, and rich response metadata via withMetadata().
 *
 * No authentication required — uses public ESI endpoints.
 *
 * Usage: npm run example:retry-timeout-metadata
 */
import { EsiClient } from '../src/EsiClient';
import {
  EsiError,
  TimeoutError,
  isTimeout,
  isRetryable,
} from '../src/core/util/error';

// --- Example 1: Retry configuration ---
async function exampleRetryConfig() {
  console.log('Example 1: Retry with exponential backoff');
  console.log('='.repeat(50));

  const client = new EsiClient({
    clientId: 'esi-ts-retry-demo',
    retryConfig: {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      retryMutations: false,
    },
  });

  try {
    // If ESI returns 502/503/504 or rate-limits us, the client retries
    // automatically with exponential backoff (1s → 2s → 4s, ±25% jitter).
    const status = await client.status.getStatus();
    console.log(`  Server online: ${status.players.toLocaleString()} players`);
    console.log('  (Retries would fire automatically on transient errors)\n');
  } catch (err) {
    if (isRetryable(err)) {
      console.error(`  Transient error after all retries: ${err.message}`);
    } else {
      console.error('  Non-retryable error:', (err as Error).message);
    }
  } finally {
    await client.shutdown();
  }
}

// --- Example 2: Backward compatibility with retryAttempts ---
async function exampleBackwardCompat() {
  console.log('Example 2: Backward-compatible retryAttempts');
  console.log('='.repeat(50));

  // The legacy retryAttempts option still works — it maps to
  // retryConfig.maxRetries with default backoff settings.
  const client = new EsiClient({
    clientId: 'esi-ts-retry-demo',
    retryAttempts: 2,
  });

  try {
    const alliances = await client.alliance.getAlliances();
    console.log(`  Fetched ${alliances.length} alliances`);
    console.log('  (retryAttempts: 2 → retryConfig.maxRetries: 2)\n');
  } catch (err) {
    console.error('  Error:', (err as Error).message);
  } finally {
    await client.shutdown();
  }
}

// --- Example 3: Timeout handling ---
async function exampleTimeout() {
  console.log('Example 3: Typed TimeoutError');
  console.log('='.repeat(50));

  // Set a very short timeout to demonstrate TimeoutError
  const client = new EsiClient({
    clientId: 'esi-ts-timeout-demo',
    timeout: 1,
  });

  try {
    await client.status.getStatus();
    console.log('  Request completed (network was fast!)');
  } catch (err) {
    if (isTimeout(err)) {
      // TypeScript narrows to TimeoutError — timeoutMs is available
      console.log(`  Caught TimeoutError after ${err.timeoutMs}ms`);
      console.log(`  instanceof EsiError: ${err instanceof EsiError}`);
      console.log(`  statusCode: ${err.statusCode}`);
      console.log(`  retryable: ${err.retryable}`);
    } else {
      console.error('  Error:', (err as Error).message);
    }
  } finally {
    await client.shutdown();
  }

  console.log();
}

// --- Example 4: Timeout + retry together ---
async function exampleTimeoutWithRetry() {
  console.log('Example 4: Timeout + retry working together');
  console.log('='.repeat(50));

  // Timeouts are retryable — a short timeout with retries gives the
  // request multiple chances to complete.
  const client = new EsiClient({
    clientId: 'esi-ts-timeout-retry-demo',
    timeout: 5,
    retryConfig: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000 },
  });

  try {
    await client.status.getStatus();
    console.log('  Succeeded (possibly after a retry)');
  } catch (err) {
    if (err instanceof TimeoutError) {
      console.log(`  Timed out after all retries (${err.timeoutMs}ms per attempt)`);
    } else {
      console.error('  Error:', (err as Error).message);
    }
  } finally {
    await client.shutdown();
  }

  console.log();
}

// --- Example 5: Response metadata via withMetadata() ---
async function exampleMetadata() {
  console.log('Example 5: Rich response metadata');
  console.log('='.repeat(50));

  const client = new EsiClient({ clientId: 'esi-ts-metadata-demo' });

  try {
    const metaClient = client.status.withMetadata();
    const result = await metaClient.getStatus();

    console.log(`  Players: ${result.data.players.toLocaleString()}`);
    console.log('  ---');
    console.log(`  fromCache:      ${result.meta.fromCache}`);
    console.log(`  cacheHitType:   ${result.meta.cacheHitType ?? '(none — fresh fetch)'}`);
    console.log(`  responseTimeMs: ${result.meta.responseTimeMs}ms`);
    console.log(`  requestId:      ${result.meta.requestId ?? '(none)'}`);

    if (result.meta.rateLimit) {
      const rl = result.meta.rateLimit;
      console.log(`  rateLimit:      ${rl.used}/${rl.limit} used, ${rl.remaining} remaining`);
    }

    // Second call hits the spec-aware cache — no HTTP request
    const cached = await metaClient.getStatus();
    console.log('  ---');
    console.log(`  Second call cacheHitType: ${cached.meta.cacheHitType}`);
    console.log(`  Second call fromCache:    ${cached.meta.fromCache}`);
    console.log(`  Second call timing:       ${cached.meta.responseTimeMs}ms\n`);
  } catch (err) {
    console.error('  Error:', (err as Error).message);
  } finally {
    await client.shutdown();
  }
}

async function main() {
  console.log('Retry, Timeout & Response Metadata Demo\n');

  await exampleRetryConfig();
  await exampleBackwardCompat();
  await exampleTimeout();
  await exampleTimeoutWithRetry();
  await exampleMetadata();

  console.log('Done.');
}

main();
