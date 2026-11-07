/**
 * The circuit breaker on its own, for 0074-circuit-breaker.feature: a real
 * CircuitBreaker reading a clock the scenario moves, so the reset timeout and
 * the stale-circuit threshold are crossed exactly.
 */
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import type { CircuitBreakerConfig } from '../../../src/core/circuitBreaker/CircuitBreaker';
import type { Clock } from '../../../src/core/ports/Clock';
import type { World } from './world';

/** Where the scenario clock starts: far from 0, which means "never failed". */
const START = 10_000_000;

export interface ScenarioClock extends Clock {
  advance(ms: number): void;
}

function scenarioClock(): ScenarioClock {
  let now = START;
  return {
    now: () => now,
    sleep: () => Promise.resolve(),
    advance(ms: number) {
      now += ms;
    },
  };
}

export function useBreaker(world: World, config: CircuitBreakerConfig): void {
  const clock = scenarioClock();
  const breaker = new CircuitBreaker(config, clock);
  world.cleanups.push(() => breaker.destroy());
  world.values.breaker = breaker;
  world.values.breakerClock = clock;
}

export function breakerOf(world: World): CircuitBreaker {
  const breaker = world.values.breaker as CircuitBreaker | undefined;
  if (!breaker) throw new Error('No circuit breaker in this scenario');
  return breaker;
}

export function breakerClock(world: World): ScenarioClock {
  return world.values.breakerClock as ScenarioClock;
}
