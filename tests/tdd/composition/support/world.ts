/**
 * Clients, payloads and trace queries shared by the composition scenarios.
 *
 * `createPipelineClient` builds a real EsiClient with every request pipeline
 * stage switched on: the rate limiter (not in test mode), circuit breaker,
 * in-flight deduplication, retry, ETag cache and Zod response validation.
 * Nothing between the client method and `fetch` is stubbed.
 */
import { EsiClient, EsiClientConfig } from '../../../../src/EsiClient';
import { createNoopLogger } from '../../../../src/core/logger/NoopLogger';
import { EsiError } from '../../../../src/core/util/error';
import { CircuitOpenError } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { ExploreOptions, Outcome, Trace, optionsFromEnv } from './interleave';

/**
 * Every retry backoff is exactly this long. retryDelay() jitters the
 * exponential delay by ±25% and then caps it at maxDelayMs, so a cap below
 * three quarters of the base delay removes the jitter without touching
 * Math.random.
 */
export const BACKOFF_MS = 500;

export const STATUS_PATH = '/status';
export const DOGMA_ATTRIBUTES_PATH = '/dogma/attributes';
export const RACES_PATH = '/universe/races';
export const CHARACTER_ID = 90000001;
export const CONTACTS_PATH = `/characters/${CHARACTER_ID}/contacts`;

/** The spec cache TTL of GET /status (esi-cache-ttls.generated.ts). */
export const STATUS_TTL_MS = 30_000;
/** The spec cache TTL of GET /characters/{id}/contacts. */
export const CONTACTS_TTL_MS = 300_000;

export function createPipelineClient(
  overrides: EsiClientConfig = {},
): EsiClient {
  return new EsiClient({
    clientId: 'composition-tier',
    baseUrl: 'https://esi.evetech.net',
    accessToken: 'composition-access-token',
    // Beyond the scheduler's horizon, so a held request never times out.
    timeout: 600_000,
    retryConfig: { maxRetries: 3, baseDelayMs: 1_000, maxDelayMs: BACKOFF_MS },
    enableCircuitBreaker: true,
    circuitBreakerConfig: { failureThreshold: 5, resetTimeoutMs: 30_000 },
    enableRequestDeduplication: true,
    enableETagCache: true,
    etagCacheConfig: { cleanupInterval: 24 * 60 * 60 * 1000 },
    validateResponse: true,
    logger: createNoopLogger(),
    ...overrides,
    rateLimiterConfig: { minDelayMs: 0, ...overrides.rateLimiterConfig },
  });
}

export function statusPayload(players: number) {
  return {
    players,
    server_version: `v${players}`,
    start_time: '2026-01-01T11:00:00Z',
    vip: false,
  };
}

export function contactsPayload(contactIds: number[]) {
  return contactIds.map((contact_id) => ({
    contact_id,
    contact_type: 'character',
    standing: 5,
  }));
}

/** Exploration options for a scenario, from the environment. */
export function scenarioOptions(testName: string): ExploreOptions {
  return { ...optionsFromEnv(), testName };
}

export function isCircuitOpen(outcome: Outcome | undefined): boolean {
  return !!outcome && !outcome.ok && outcome.error instanceof CircuitOpenError;
}

export function rejectedStatus(
  outcome: Outcome | undefined,
): number | undefined {
  return outcome && !outcome.ok && outcome.error instanceof EsiError
    ? outcome.error.statusCode
    : undefined;
}

export function describeOutcome(outcome: Outcome | undefined): string {
  if (!outcome) return 'never settled';
  if (outcome.ok) return `resolved ${JSON.stringify(outcome.value)}`;
  const error = outcome.error as { name?: string; message?: string };
  return `rejected ${error.name ?? 'error'}: ${error.message ?? String(error)}`;
}

/** Index of the first event matching the predicate, or -1. */
export function eventIndex(
  trace: Trace,
  predicate: (e: Trace['events'][number]) => boolean,
): number {
  return trace.events.findIndex(predicate);
}

/** The position in the event log at which request `ordinal` was delivered. */
export function deliveryIndex(trace: Trace, ordinal: number): number {
  return eventIndex(
    trace,
    (e) => e.kind === 'deliver' && e.ordinal === ordinal,
  );
}

/** The position in the event log at which request `ordinal` was sent. */
export function sendIndex(trace: Trace, ordinal: number): number {
  return eventIndex(trace, (e) => e.kind === 'send' && e.ordinal === ordinal);
}

/**
 * Checks the size of an exploration. In exhaustive mode the schedule count is
 * pinned: it changes only when the pipeline starts sending, holding or timing
 * requests differently, which is exactly when the scenario needs a second
 * look. A count that grew past the bound, or shrank because the calls stopped
 * overlapping, fails here rather than silently testing less.
 */
export function expectExplored(
  report: { mode: string; schedules: number; complete: boolean; seed: number },
  pinnedSchedules: number,
  options: ExploreOptions,
): void {
  if (report.mode === 'replay') return;
  if (report.mode === 'random') {
    if (report.schedules !== options.runs) {
      throw new Error(
        `random exploration ran ${report.schedules} schedules, expected ${options.runs} (seed ${report.seed})`,
      );
    }
    return;
  }
  if (!report.complete || report.schedules !== pinnedSchedules) {
    throw new Error(
      `exhaustive exploration ${report.complete ? 'completed' : 'stopped at the bound'} after ${report.schedules} schedules; the pinned count is ${pinnedSchedules}. ` +
        'The set of interleavings changed: check the new schedules still exercise the interaction, then update the pinned count.',
    );
  }
}
