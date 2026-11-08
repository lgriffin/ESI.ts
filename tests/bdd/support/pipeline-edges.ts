/**
 * What 0077-pipeline-edges.feature configures: clients with the circuit
 * breaker on, interceptors that record what the pipeline hands them, and the
 * spec TTL of the server status route.
 */
import type { CircuitBreakerConfig } from '../../../src/core/circuitBreaker/CircuitBreaker';
import type {
  RequestContext,
  ResponseContext,
} from '../../../src/core/middleware/Middleware';
import { lookupSpecTtl } from '../../../src/core/requestPipeline/cachePolicy';
import { statusEndpoints } from '../../../src/core/endpoints/statusEndpoints';
import { ManualClock } from './shared-runtime';
import { createSeamClient } from './transport';
import type { World } from './world';

export function breakerClient(
  world: World,
  circuitBreakerConfig: CircuitBreakerConfig,
  timeout = 5000,
): void {
  world.client = createSeamClient({
    enableCircuitBreaker: true,
    circuitBreakerConfig: { resetTimeoutMs: 60_000, ...circuitBreakerConfig },
    retryConfig: { maxRetries: 0 },
    timeout,
  });
}

/** The server status route's spec TTL, in milliseconds. */
export function statusSpecTtl(): number {
  const ttl = lookupSpecTtl('GET', statusEndpoints.getStatus.path);
  if (!ttl) throw new Error('The server status route has no spec TTL');
  return ttl;
}

export function recordRequests(world: World): RequestContext[] {
  const seen: RequestContext[] = [];
  world.client.addRequestInterceptor((context) => {
    seen.push(context);
    return context;
  });
  world.values.seenRequests = seen;
  return seen;
}

export function clientRecordingResponses(
  world: World,
  requestMs: number,
): void {
  const clock = new ManualClock();
  world.values.clock = clock;
  world.client = createSeamClient({ clock });
  // A request interceptor runs after the client notes the start time, so
  // moving the clock here is time the request took.
  world.client.addRequestInterceptor((context) => {
    clock.advance(requestMs);
    return context;
  });
  const seen: ResponseContext[] = [];
  world.client.addResponseInterceptor((context) => {
    seen.push(context);
    return context;
  });
  world.values.seenResponses = seen;
}

export async function settle<T>(action: () => Promise<T>) {
  try {
    return { ok: true as const, value: await action() };
  } catch (error) {
    return { ok: false as const, error };
  }
}
