import type { ApiClient } from './ApiClient';
import type { ETagCacheManager } from './cache/ETagCacheManager';
import { EsiDiagnostics } from './EsiDiagnostics';

/** What a construction surface supplied rather than built, so shutdown leaves it. */
export interface PipelineOwnership {
  readonly suppliedCache: boolean;
  readonly suppliedCircuitBreaker: boolean;
}

const owners = new WeakMap<ApiClient, PipelineOwnership>();
const diagnostics = new WeakMap<ApiClient, EsiDiagnostics>();

/**
 * Records that a domain client built on `client` owns its pipeline, as one
 * from `EsiApiFactory.createClient` does, so the client's `shutdown()` stops
 * the cache and circuit breaker it built. A client reached through
 * `EsiClient` or `CustomEsiClient` shares a pipeline it does not own.
 */
export function claimPipeline(
  client: ApiClient,
  ownership: PipelineOwnership,
): void {
  owners.set(client, ownership);
}

/**
 * The one `EsiDiagnostics` for a pipeline: every surface over the same
 * `ApiClient` reads and resets it through the same object, so stats are
 * never split. `etagCacheEnabled` applies when the object is first made.
 */
export function diagnosticsFor(
  client: ApiClient,
  etagCacheEnabled: boolean = client.getCache() !== null,
): EsiDiagnostics {
  let found = diagnostics.get(client);
  if (!found) {
    found = new EsiDiagnostics(
      client,
      etagCacheEnabled,
      client.getDeduplicator(),
    );
    diagnostics.set(client, found);
  }
  return found;
}

/**
 * Stops the cleanup timers of the cache and circuit breaker an owned
 * pipeline built and drops its in-flight table; a supplied cache or circuit
 * breaker is left to its owner. Returns false, doing nothing, for a pipeline
 * nothing claimed.
 */
export function shutdownOwnedPipeline(client: ApiClient): boolean {
  const ownership = owners.get(client);
  if (!ownership) return false;
  const cache = client.getCache();
  if (cache && !ownership.suppliedCache) {
    (cache as ETagCacheManager).shutdown();
  }
  const breaker = client.getCircuitBreaker();
  if (breaker && !ownership.suppliedCircuitBreaker) breaker.shutdown();
  (client.getDeduplicator() as { clear?: () => void } | null)?.clear?.();
  return true;
}
