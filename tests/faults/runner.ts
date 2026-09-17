/**
 * Runs one fault against one target through the real pipeline and compares
 * what the client did with what the fault expects.
 *
 * Everything below the client method is real: rate limiter, retry, dedup,
 * circuit breaker, ETag cache, JSON parsing, validation. Only `fetch` is
 * replaced, by the BDD transport seam. Timers and `Date` run on Jest's fake
 * clock, driven here, so a 60-second rate-limit block or a 250 ms timeout
 * costs no wall-clock time and the elapsed time is exact.
 */
import { isDeepStrictEqual, inspect } from 'util';
import { EsiClient } from '../../src/EsiClient';
import {
  EsiError,
  EsiValidationError,
  TimeoutError,
} from '../../src/core/util/error';
import { setLogger, getLogger } from '../../src/core/logger/loggerUtil';
import type { ILogger } from '../../src/core/logger/ILogger';
import {
  createSeamClient,
  drainTransport,
  queueResponse,
  sentRequests,
  SEAM_RETRY,
} from '../bdd/support/transport';
import type {
  ExpectedError,
  Fault,
  FaultContext,
  Outcome,
  Target,
} from './types';

/** A fixed epoch so Retry-After dates and cache timestamps are reproducible. */
export const EPOCH = Date.UTC(2026, 8, 17, 11, 0, 0);

/** Virtual time a call may take before it counts as hung. */
const HANG_BUDGET_MS = 30 * 60 * 1000;

export function useVirtualClock(): void {
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
      now: EPOCH,
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });
}

/**
 * Deep equality of JSON data. Bodies parsed by fetch live in Node's realm and
 * Zod rebuilds objects, so prototypes differ from the test's literals;
 * comparing canonical JSON avoids a false mismatch.
 */
function sameJson(a: unknown, b: unknown): boolean {
  const canon = (v: unknown): unknown =>
    v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as unknown);
  return isDeepStrictEqual(canon(a), canon(b));
}

const realTurn = () => new Promise<void>((resolve) => setImmediate(resolve));

type Settled =
  | { state: 'resolved'; value: unknown }
  | { state: 'rejected'; error: unknown }
  | { state: 'hung' };

/**
 * Settle a promise on the virtual clock: let real I/O and microtasks run,
 * then advance to the next timer, until the promise settles or the hang
 * budget of virtual time is spent.
 */
export async function drive(promise: Promise<unknown>): Promise<Settled> {
  let settled: Settled | undefined;
  promise.then(
    (value) => (settled = { state: 'resolved', value }),
    (error: unknown) => (settled = { state: 'rejected', error }),
  );
  const deadline = Date.now() + HANG_BUDGET_MS;
  for (;;) {
    for (let i = 0; i < 20 && !settled; i++) await realTurn();
    if (settled) return settled;
    if (Date.now() >= deadline || jest.getTimerCount() === 0) {
      return { state: 'hung' };
    }
    await jest.advanceTimersToNextTimerAsync();
  }
}

interface LogEntry {
  level: 'warn' | 'error';
  message: string;
}

function captureLogger(into: LogEntry[]): ILogger {
  const keep = (level: LogEntry['level']) => (message: string) =>
    into.push({ level, message });
  const drop = () => undefined;
  return {
    fatal: keep('error'),
    error: keep('error'),
    warn: keep('warn'),
    info: drop,
    debug: drop,
    trace: drop,
  };
}

export interface Observation {
  settled: Settled;
  requests: number;
  elapsedMs: number;
  logs: LogEntry[];
  /** Mismatches found while probing the cache after the call. */
  cacheProblems: string[];
}

function faultClient(target: Target, logger: ILogger): EsiClient {
  return createSeamClient({
    logger,
    timeout: target.timeoutMs,
    retryConfig: { ...SEAM_RETRY, maxRetries: target.retries },
  });
}

function unwrap(settled: Settled): unknown {
  return settled.state === 'resolved'
    ? (settled.value as { data: unknown }).data
    : undefined;
}

/**
 * Serve `fault` to `target`, then probe what the cache holds.
 */
export async function observe(
  target: Target,
  fault: Fault,
): Promise<Observation> {
  const logs: LogEntry[] = [];
  const logger = captureLogger(logs);
  const previousGlobal = getLogger();
  // The rate limiter logs through the global logger.
  setLogger(logger);
  const client = faultClient(target, logger);
  const good = target.good();
  const ctx: FaultContext = { target, good };
  const pastFreshness = () =>
    jest.setSystemTime(Date.now() + (target.specTtlMs ?? 0) + 1);

  try {
    if (fault.prime) {
      good.responses.forEach((r) => queueResponse(r));
      const primed = await drive(target.call(client));
      if (
        primed.state !== 'resolved' ||
        !sameJson(unwrap(primed), good.result)
      ) {
        throw new Error(
          `Priming ${target.name} with its good exchange failed (${describeSettled(primed)}); the fault cannot run.`,
        );
      }
      pastFreshness();
      logs.length = 0;
    }

    const before = sentRequests().length;
    fault.exchange(ctx).forEach((r) => queueResponse(r));
    const start = Date.now();
    const settled = await drive(target.call(client));
    const elapsedMs = Date.now() - start;
    const requests = sentRequests().length - before;
    const callLogs = [...logs];

    const expected = fault.expected(ctx);
    const cacheProblems =
      settled.state === 'hung'
        ? []
        : await probeCache(target, client, expected, settled, good.result);

    return { settled, requests, elapsedMs, logs: callLogs, cacheProblems };
  } finally {
    client.shutdown();
    setLogger(previousGlobal);
  }

  async function probeCache(
    t: Target,
    c: EsiClient,
    expected: Outcome,
    settled: Settled,
    goodResult: unknown,
  ): Promise<string[]> {
    const problems: string[] = [];
    pastFreshness();
    const before = sentRequests().length;

    if (t.method !== 'GET') {
      const entries = c.getCacheStats()?.totalEntries ?? 0;
      if (expected.cache === 'empty' && entries !== 0) {
        problems.push(`the cache holds ${entries} entries after a ${t.method}`);
      }
      return problems;
    }

    if (expected.cache === 'empty') {
      t.good().responses.forEach((r) => queueResponse(r));
      const next = await drive(t.call(c));
      const first = sentRequests()[before];
      if (!first) {
        problems.push(
          'the next call sent no request: it was served from the cache',
        );
      } else if (first.headers['if-none-match'] !== undefined) {
        problems.push(
          `the next call revalidated with If-None-Match ${first.headers['if-none-match']}: an entry was cached`,
        );
      }
      if (!sameJson(unwrap(next), goodResult)) {
        problems.push(
          `the next call did not return a fresh good result (${describeSettled(next)})`,
        );
      }
      return problems;
    }

    // holds-result: revalidation with the target's ETag, answered by 304.
    queueResponse({ status: 304, headers: { etag: t.etag! } });
    const next = await drive(t.call(c));
    const first = sentRequests()[before];
    if (!first) {
      problems.push('the next call sent no request after the freshness TTL');
    } else if (first.headers['if-none-match'] !== t.etag) {
      problems.push(
        `the next call sent If-None-Match ${String(first.headers['if-none-match'])}, expected ${t.etag}: the entry is missing or replaced`,
      );
    }
    const wanted =
      'resolves' in expected.settlement
        ? unwrap(settled)
        : fault.prime
          ? goodResult
          : undefined;
    if (!sameJson(unwrap(next), wanted)) {
      problems.push(
        `the 304 revalidation returned ${describeSettled(next)}, expected the cached ${inspect(wanted, { depth: 4, breakLength: Infinity })}`,
      );
    }
    return problems;
  }
}

function describeSettled(s: Settled): string {
  if (s.state === 'hung') return 'never settled';
  if (s.state === 'resolved') {
    return `resolved ${inspect(unwrap(s), { depth: 4, breakLength: Infinity })}`;
  }
  return `rejected ${describeError(s.error)}`;
}

function errorClass(err: unknown): string {
  if (err instanceof EsiValidationError) return 'EsiValidationError';
  if (err instanceof TimeoutError) return 'TimeoutError';
  if (err instanceof EsiError) return 'EsiError';
  if (err instanceof Error && /\[[A-Z_]+\]/.test(err.message)) {
    return 'CodedError';
  }
  return err instanceof Error ? err.constructor.name : typeof err;
}

function describeError(err: unknown): string {
  const status = err instanceof EsiError ? ` status ${err.statusCode}` : '';
  const message = err instanceof Error ? err.message : String(err);
  return `${errorClass(err)}${status} "${message}"`;
}

/** The innermost bracketed code, ignoring the pipeline's ESIJS_ERROR wrapper. */
function faultCode(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;
  const codes = [...err.message.matchAll(/\[([A-Z_]+)\]/g)].map((m) => m[1]);
  return codes.find((c) => c !== 'ESIJS_ERROR') ?? codes[0];
}

function errorProblems(expected: ExpectedError, err: unknown): string[] {
  const problems: string[] = [];
  const actualClass = errorClass(err);
  if (actualClass !== expected.class) {
    problems.push(
      `error class: expected ${expected.class}, got ${describeError(err)}`,
    );
    return problems;
  }
  if (expected.class === 'CodedError') {
    if (faultCode(err) !== expected.code) {
      problems.push(
        `error code: expected [${expected.code}], got ${describeError(err)}`,
      );
    }
  } else if ((err as EsiError).statusCode !== expected.statusCode) {
    problems.push(
      `statusCode: expected ${expected.statusCode}, got ${(err as EsiError).statusCode}`,
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  if (!expected.message.test(message)) {
    problems.push(
      `error message: expected to match ${String(expected.message)}, got "${message}"`,
    );
  }
  return problems;
}

/** Every way the observation departs from the expected outcome. */
export function compare(expected: Outcome, seen: Observation): string[] {
  const problems: string[] = [];
  const s = expected.settlement;

  if (seen.settled.state === 'hung') {
    problems.push(
      `settlement: the call never settled within ${HANG_BUDGET_MS / 60000} minutes of virtual time`,
    );
    return problems;
  }

  if ('rejects' in s) {
    if (seen.settled.state === 'resolved') {
      problems.push(
        `settlement: expected a rejection with ${s.rejects.class}, but the call ${describeSettled(seen.settled)}`,
      );
    } else {
      problems.push(...errorProblems(s.rejects, seen.settled.error));
    }
  } else if (seen.settled.state === 'rejected') {
    problems.push(
      `settlement: expected the call to resolve, but it ${describeSettled(seen.settled)}`,
    );
  } else {
    const value = seen.settled.value as {
      data: unknown;
      meta: { stale: boolean };
    };
    if (!sameJson(value.data, s.resolves)) {
      problems.push(
        `resolved value: expected ${inspect(s.resolves, { depth: 4, breakLength: Infinity })}, got ${inspect(value.data, { depth: 4, breakLength: Infinity })}`,
      );
    }
    if (value.meta.stale !== s.stale) {
      problems.push(`meta.stale: expected ${s.stale}, got ${value.meta.stale}`);
    }
  }

  if (seen.requests !== expected.requests) {
    problems.push(
      `requests (retry count): expected ${expected.requests}, the client sent ${seen.requests}`,
    );
  }

  const { min, max } = expected.elapsedMs;
  if (seen.elapsedMs < min || seen.elapsedMs > max) {
    problems.push(
      `elapsed time: expected ${min}-${max} ms, took ${seen.elapsedMs} ms`,
    );
  }

  for (const log of expected.logs) {
    const matching = seen.logs.filter(
      (entry) => entry.level === log.level && log.message.test(entry.message),
    ).length;
    if (matching !== log.count) {
      problems.push(
        `log: expected ${log.count} ${log.level} entries matching ${String(log.message)}, found ${matching}`,
      );
    }
  }
  const unexpected = seen.logs.filter(
    (entry) =>
      !expected.logs.some(
        (log) => log.level === entry.level && log.message.test(entry.message),
      ),
  );
  if (unexpected.length > 0) {
    problems.push(
      `log: unexpected ${unexpected.map((e) => `${e.level} "${e.message}"`).join('; ')}`,
    );
  }

  problems.push(
    ...seen.cacheProblems.map((p) => `cache (${expected.cache}): ${p}`),
  );
  return problems;
}

export function describeRule(fault: Fault): string {
  return 'feature' in fault.rule
    ? `tests/bdd/features/${fault.rule.feature} — Rule: ${fault.rule.rule}`
    : `guides/${fault.rule.guide} — ${fault.rule.section}`;
}

/** A failure message naming the broken invariants and how to reproduce. */
export function failureMessage(
  target: Target,
  fault: Fault,
  problems: string[],
): string {
  return [
    `Fault "${fault.id}" on ${target.name} (${fault.title}) broke ${problems.length} invariant(s):`,
    ...problems.map((p) => `  - ${p}`),
    `Specified by: ${describeRule(fault)}`,
    `Reproduce: npx jest --config jest.faults.config.cjs --testPathPatterns=transport-faults -t "${fault.id} ${target.name}"`,
  ].join('\n');
}

/**
 * Run the fault and return every broken invariant (empty when the client did
 * exactly what the fault expects). Leaves the transport queue empty.
 */
export async function checkFault(
  target: Target,
  fault: Fault,
): Promise<string[]> {
  let seen: Observation;
  try {
    seen = await observe(target, fault);
  } catch (err) {
    drainTransport();
    throw err;
  }
  const leftovers = drainTransport();
  const problems = compare(
    fault.expected({ target, good: target.good() }),
    seen,
  );
  return [
    ...problems,
    ...leftovers.unrequested.map(
      (d) => `exchange: queued response never requested: ${d}`,
    ),
    ...leftovers.unexpected.map((d) => `exchange: unexpected request: ${d}`),
  ];
}
