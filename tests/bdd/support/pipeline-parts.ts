/**
 * What 0081-pipeline-parts.feature builds and reads: batches run through an
 * EsiClient that logs to a recording logger, a deduplicator and a retry
 * strategy on their own, an ApiClient set up the way the construction
 * surfaces set one up, and the pipeline-ownership and identity helpers.
 */
import { ApiClient } from '../../../src/core/ApiClient';
import { configureApiClient } from '../../../src/core/configureApiClient';
import type { EsiClientConfig } from '../../../src/core/EsiClientConfig';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { type RecordingLogger, recordingLogger } from './logging';
import { ManualClock } from './shared-runtime';
import type { World } from './world';

export function loggerOf(world: World): RecordingLogger {
  const logger = world.values.partsLogger as RecordingLogger | undefined;
  if (!logger) throw new Error('No recording logger in this scenario');
  return logger;
}

/** A fresh recording logger for the scenario. */
export function useLogger(world: World): RecordingLogger {
  const logger = recordingLogger();
  world.values.partsLogger = logger;
  return logger;
}

/** The line logged with `message`, as `level` and context. */
export function lineOf(
  world: World,
  message: string,
): { level: string; context: unknown } {
  const line = loggerOf(world).lines.find((l) => l.message === message);
  if (!line) {
    const seen = loggerOf(world).lines.map((l) => l.message);
    throw new Error(`No line "${message}" among: ${seen.join(' | ')}`);
  }
  return { level: line.level, context: line.context };
}

export function hasLineStarting(world: World, prefix: string): boolean {
  return loggerOf(world).lines.some((l) => l.message.startsWith(prefix));
}

// ── Batches

export interface BatchProbe {
  running: number;
  mostAtOnce: number;
  fetched: string[];
  progress: string[];
}

/**
 * A fetcher that answers each key after a macrotask, so fetches started
 * together overlap, and records how many ran at once. A key named in
 * `failures` fails: with an Error when its value is an Error, otherwise by
 * throwing the value itself.
 */
export function probeFetcher(
  probe: BatchProbe,
  failures: Map<string, unknown>,
): (key: string) => Promise<string> {
  return async (key) => {
    probe.fetched.push(key);
    probe.running += 1;
    probe.mostAtOnce = Math.max(probe.mostAtOnce, probe.running);
    await new Promise((resolve) => setTimeout(resolve, 1));
    probe.running -= 1;
    if (failures.has(key)) throw failures.get(key);
    return `value of ${key}`;
  };
}

export function newProbe(): BatchProbe {
  return { running: 0, mostAtOnce: 0, fetched: [], progress: [] };
}

/** The keys `k1` to `kN`. */
export function keys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `k${i + 1}`);
}

/** The IDs 1 to `count`. */
export function ids(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

// ── A deduplicator on its own

export function useDeduplicator(world: World): RequestDeduplicator {
  const logger = useLogger(world);
  const client = new ApiClient('bdd-parts', 'https://esi.evetech.net');
  client.setLogger(logger);
  const deduplicator = new RequestDeduplicator();
  deduplicator.setClient(client);
  world.values.deduplicator = deduplicator;
  world.values.executions = {} as Record<string, number>;
  return deduplicator;
}

export function deduplicatorOf(world: World): RequestDeduplicator {
  const deduplicator = world.values.deduplicator as
    RequestDeduplicator | undefined;
  if (!deduplicator) throw new Error('No deduplicator in this scenario');
  return deduplicator;
}

/** Starts a request for `key` that stays in flight, counting executions. */
export function startRequest(world: World, key: string): Promise<unknown> {
  const executions = world.values.executions as Record<string, number>;
  return deduplicatorOf(world).dedupe(key, () => {
    executions[key] = (executions[key] ?? 0) + 1;
    return new Promise<never>(() => {});
  });
}

// ── An ApiClient as the construction surfaces set one up

export function useConfiguredClient(
  world: World,
  config: EsiClientConfig = {},
): ApiClient {
  const logger = useLogger(world);
  const client = new ApiClient('bdd-parts', 'https://esi.evetech.net');
  const clock = new ManualClock();
  configureApiClient(client, { logger, clock, ...config });
  world.values.apiClient = client;
  world.values.clock = clock;
  world.cleanups.push(() => {
    (client.getCache() as { shutdown?: () => void } | null)?.shutdown?.();
    client.getCircuitBreaker()?.shutdown();
  });
  return client;
}

export function apiClientOf(world: World): ApiClient {
  const client = world.values.apiClient as ApiClient | undefined;
  if (!client) throw new Error('No ApiClient in this scenario');
  return client;
}
