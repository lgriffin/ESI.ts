/**
 * A status client whose pipeline carries a RateLimiter the scenario can read
 * (0061-rate-limit-status.feature). Requests go to the transport seam.
 */
import { StatusClient } from '../../../src/clients/StatusClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { configureApiClient } from '../../../src/core/configureApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import type { World } from './world';
import { SEAM_ACCESS_TOKEN } from './transport';

export function pipelineWithRateLimiter(world: World): void {
  const api = new ApiClient(
    'bdd-rate-limit',
    'https://esi.evetech.net',
    SEAM_ACCESS_TOKEN,
  );
  configureApiClient(api, {
    retryConfig: { maxRetries: 0 },
    logLevel: 'error',
  });
  const limiter = new RateLimiter({ minDelayMs: 0 });
  api.setRateLimiter(limiter);
  world.values.limiter = limiter;
  world.values.statusClient = new StatusClient(api);
}

export function limiterOf(world: World): RateLimiter {
  const limiter = world.values.limiter as RateLimiter | undefined;
  if (!limiter) throw new Error('No rate limiter was set up in this scenario');
  return limiter;
}

export function statusClientOf(world: World): StatusClient {
  const client = world.values.statusClient as StatusClient | undefined;
  if (!client) throw new Error('No status client was set up in this scenario');
  return client;
}
