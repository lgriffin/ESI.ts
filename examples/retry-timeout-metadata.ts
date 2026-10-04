/**
 * ESI.ts Example: Retry, Timeout & Response Metadata
 *
 * Demonstrates retry with exponential backoff, request timeouts,
 * TimeoutError handling, and rich response metadata via withMetadata().
 *
 * No authentication required — uses public ESI endpoints.
 *
 * Usage: npm run example:retry-timeout-metadata
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import {
  EsiError,
  TimeoutError,
  isTimeout,
  isRetryable,
} from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

// --- Example 1: Retry configuration ---
async function exampleRetryConfig() {
  log.info('Example 1: Retry with exponential backoff');
  log.info('='.repeat(50));

  const client = new EsiClient({
    logger: esiLog,
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
    log.info(`  Server online: ${status.players.toLocaleString()} players`);
    log.info('  (Retries would fire automatically on transient errors)\n');
  } catch (err) {
    if (isRetryable(err)) {
      log.error(`  Transient error after all retries: ${err.message}`);
    } else {
      log.error('Non-retryable error', { error: err });
    }
  } finally {
    await client.shutdown();
  }
}

// --- Example 2: Backward compatibility with retryAttempts ---
async function exampleBackwardCompat() {
  log.info('Example 2: Backward-compatible retryAttempts');
  log.info('='.repeat(50));

  // The legacy retryAttempts option still works — it maps to
  // retryConfig.maxRetries with default backoff settings.
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-retry-demo',
    retryAttempts: 2,
  });

  try {
    const alliances = await client.alliance.getAlliances();
    log.info(`  Fetched ${alliances.length} alliances`);
    log.info('  (retryAttempts: 2 → retryConfig.maxRetries: 2)\n');
  } catch (err) {
    log.error('Request failed', { error: err });
  } finally {
    await client.shutdown();
  }
}

// --- Example 3: Timeout handling ---
async function exampleTimeout() {
  log.info('Example 3: Typed TimeoutError');
  log.info('='.repeat(50));

  // Set a very short timeout to demonstrate TimeoutError
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-timeout-demo',
    timeout: 1,
  });

  try {
    await client.status.getStatus();
    log.info('  Request completed (network was fast!)');
  } catch (err) {
    if (isTimeout(err)) {
      // TypeScript narrows to TimeoutError — timeoutMs is available
      log.info(`  Caught TimeoutError after ${err.timeoutMs}ms`);
      log.info(`  instanceof EsiError: ${err instanceof EsiError}`);
      log.info(`  statusCode: ${err.statusCode}`);
      log.info(`  retryable: ${err.retryable}`);
    } else {
      log.error('Request failed', { error: err });
    }
  } finally {
    await client.shutdown();
  }

  log.info('');
}

// --- Example 4: Timeout + retry together ---
async function exampleTimeoutWithRetry() {
  log.info('Example 4: Timeout + retry working together');
  log.info('='.repeat(50));

  // Timeouts are retryable — a short timeout with retries gives the
  // request multiple chances to complete.
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-timeout-retry-demo',
    timeout: 5,
    retryConfig: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000 },
  });

  try {
    await client.status.getStatus();
    log.info('  Succeeded (possibly after a retry)');
  } catch (err) {
    if (err instanceof TimeoutError) {
      log.info(
        `  Timed out after all retries (${err.timeoutMs}ms per attempt)`,
      );
    } else {
      log.error('Request failed', { error: err });
    }
  } finally {
    await client.shutdown();
  }

  log.info('');
}

// --- Example 5: Response metadata via withMetadata() ---
async function exampleMetadata() {
  log.info('Example 5: Rich response metadata');
  log.info('='.repeat(50));

  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-metadata-demo',
  });

  try {
    const metaClient = client.status.withMetadata();
    const result = await metaClient.getStatus();

    log.info(`  Players: ${result.data.players.toLocaleString()}`);
    log.info('  ---');
    log.info(`  fromCache:      ${result.meta.fromCache}`);
    log.info(
      `  cacheHitType:   ${result.meta.cacheHitType ?? '(none — fresh fetch)'}`,
    );
    log.info(`  responseTimeMs: ${result.meta.responseTimeMs}ms`);
    log.info(`  requestId:      ${result.meta.requestId ?? '(none)'}`);

    if (result.meta.rateLimit) {
      const rl = result.meta.rateLimit;
      log.info(
        `  rateLimit:      ${rl.used}/${rl.limit} used, ${rl.remaining} remaining`,
      );
    }

    // Second call hits the spec-aware cache — no HTTP request
    const cached = await metaClient.getStatus();
    log.info('  ---');
    log.info(`  Second call cacheHitType: ${cached.meta.cacheHitType}`);
    log.info(`  Second call fromCache:    ${cached.meta.fromCache}`);
    log.info(`  Second call timing:       ${cached.meta.responseTimeMs}ms\n`);
  } catch (err) {
    log.error('Request failed', { error: err });
  } finally {
    await client.shutdown();
  }
}

async function main() {
  log.info('Retry, Timeout & Response Metadata Demo\n');

  await exampleRetryConfig();
  await exampleBackwardCompat();
  await exampleTimeout();
  await exampleTimeoutWithRetry();
  await exampleMetadata();

  log.info('Done.');
}

main();
