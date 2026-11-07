/**
 * The rate limiter on its own, for 0080-rate-limiter.feature: a real
 * RateLimiter on a clock that moves forward by every wait it is asked for and
 * records it, logging its warnings to a recording logger. Responses are fed
 * to it as the pipeline feeds them, and clearances are asked as the pipeline
 * asks them before each request.
 */
import { ApiClient } from '../../../src/core/ApiClient';
import type { Clock } from '../../../src/core/ports/Clock';
import {
  RateLimiter,
  type RateLimiterConfig,
} from '../../../src/core/rateLimiter/RateLimiter';
import { type RecordingLogger, recordingLogger } from './logging';
import type { World } from './world';

/** Where the limiter clock starts: any fixed time far from 0. */
export const LIMITER_CLOCK_START = 10_000_000;

/** The request header a per-user limiter keys its buckets by. */
export const USER_HEADER = 'x-bdd-user';

export interface LimiterClock extends Clock {
  readonly waits: number[];
  advance(ms: number): void;
  /** Runs after every wait, once the clock has moved past it. */
  afterEachWait: (() => void) | undefined;
}

function limiterClock(): LimiterClock {
  let now = LIMITER_CLOCK_START;
  const clock: LimiterClock = {
    waits: [],
    afterEachWait: undefined,
    now: () => now,
    sleep(ms: number) {
      clock.waits.push(ms);
      now += ms;
      clock.afterEachWait?.();
      return Promise.resolve();
    },
    advance(ms: number) {
      now += ms;
    },
  };
  return clock;
}

export function useLimiter(world: World, config?: RateLimiterConfig): void {
  const clock = limiterClock();
  const limiter = new RateLimiter(config, clock);
  const logger = recordingLogger();
  const client = new ApiClient('bdd-rate-limiter', 'https://esi.evetech.net');
  client.setLogger(logger);
  limiter.setClient(client);
  world.values.rateLimiter = limiter;
  world.values.limiterClock = clock;
  world.values.limiterLogger = logger;
}

export function rateLimiterOf(world: World): RateLimiter {
  const limiter = world.values.rateLimiter as RateLimiter | undefined;
  if (!limiter) throw new Error('No rate limiter in this scenario');
  return limiter;
}

export function limiterClockOf(world: World): LimiterClock {
  return world.values.limiterClock as LimiterClock;
}

export function limiterLoggerOf(world: World): RecordingLogger {
  return world.values.limiterLogger as RecordingLogger;
}

/** `name=value, name=value` as a header record. */
export function parseHeaders(list: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const pair of list.split(/,\s*(?=[a-z-]+=)/)) {
    if (!pair.trim()) continue;
    const at = pair.indexOf('=');
    headers[pair.slice(0, at).trim()] = pair.slice(at + 1);
  }
  return headers;
}

export function userHeaders(
  user: string | undefined,
): Record<string, string> | undefined {
  return user === undefined ? undefined : { [USER_HEADER]: user };
}

/** Feeds the limiter a response, as the pipeline does after each request. */
export function readResponse(
  world: World,
  status: number,
  method: string,
  path: string,
  headers: string,
  user?: string,
): void {
  rateLimiterOf(world).updateFromResponse(
    parseHeaders(headers),
    status,
    path,
    method,
    userHeaders(user),
  );
}

/**
 * Asks the limiter to clear a request, recording the waits it took and the
 * error it refused with.
 */
export async function clearRequest(
  world: World,
  method: string,
  path: string,
  user?: string,
): Promise<void> {
  const clock = limiterClockOf(world);
  clock.waits.length = 0;
  world.error = undefined;
  try {
    await rateLimiterOf(world).checkRateLimit(path, method, userHeaders(user));
  } catch (error: unknown) {
    world.error = error;
  }
  world.values.lastWaits = [...clock.waits];
}

/** The waits the last clearance took, as `a, b`, or `none`. */
export function lastWaits(world: World): string {
  const waits = world.values.lastWaits as number[] | undefined;
  if (!waits) throw new Error('No clearance was asked in this scenario');
  return waits.length === 0 ? 'none' : waits.join(', ');
}

/** The warnings the limiter logged, with their context. */
export function warnings(
  world: World,
): { message: string; context: unknown }[] {
  return limiterLoggerOf(world)
    .lines.filter((line) => line.level === 'warn')
    .map((line) => ({ message: line.message, context: line.context }));
}
