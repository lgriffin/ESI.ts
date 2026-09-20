/**
 * Circuit breaker: model-based property.
 *
 * A reference model of the state machine in guides/ARCHITECTURE.md §7
 * (closed → open → half-open → closed) runs next to the real
 * `CircuitBreaker` under random command sequences: calls admitted or
 * rejected, outcomes recorded in any order (so admitted calls overlap, as
 * concurrent requests and half-open probes do), direct failure reports with
 * any status, and clock advances. After every command the real breaker's
 * admit/reject decision and its reported state must equal the model's.
 *
 * The model is the specification:
 *
 *   closed     admit. Countable failure (status 0, 420, 429, >= 500) adds one;
 *              reaching failureThreshold opens. Success resets the count.
 *   open       reject until resetTimeoutMs has passed since the last failure;
 *              then the next call moves to half-open and is admitted as the
 *              first probe. A late success from a call admitted before the
 *              circuit opened does not close it. A late failure restarts the
 *              reset timeout.
 *   half-open  admit at most halfOpenMaxAttempts probes in total. Success
 *              closes; failure reopens.
 *
 * Status codes that are not countable failures are ignored by recordFailure.
 * The pipeline (executeSingleFetch) reports every other response as a success.
 */
import * as fc from 'fast-check';

import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitOpenError,
  CircuitState,
} from '../../src/core/circuitBreaker/CircuitBreaker';
import { ICircuitBreaker } from '../../src/core/circuitBreaker/ICircuitBreaker';
import { describeProperty, invariant } from './support/property';

type BreakerFactory = (config: CircuitBreakerConfig) => ICircuitBreaker;

interface Config {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

interface CircuitModel {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  probes: number;
}

interface Model {
  config: Config;
  now: number;
  circuits: Map<string, CircuitModel>;
  /** Keys of calls admitted and not yet completed, oldest first. */
  inFlight: string[];
}

interface Real {
  breaker: ICircuitBreaker;
  clock: { now: number };
  inFlight: string[];
}

/** Two keys; the query-string variant must share its path's circuit. */
const ENDPOINTS = [
  'status/',
  'characters/90000001/',
  'characters/90000001/?page=2',
];

function keyOf(endpoint: string): string {
  return endpoint.split('?')[0]!;
}

function isCountableFailure(status: number): boolean {
  return status === 0 || status === 420 || status === 429 || status >= 500;
}

function circuit(model: Model, key: string): CircuitModel {
  let c = model.circuits.get(key);
  if (!c) {
    c = { state: 'closed', failures: 0, lastFailureTime: 0, probes: 0 };
    model.circuits.set(key, c);
  }
  return c;
}

function reportedState(model: Model, key: string): CircuitState {
  const c = model.circuits.get(key);
  if (!c) return 'closed';
  if (
    c.state === 'open' &&
    model.now - c.lastFailureTime >= model.config.resetTimeoutMs
  ) {
    return 'half-open';
  }
  return c.state;
}

/** The model's decision for a call. Mutates the model when it admits. */
function modelAdmits(model: Model, key: string): boolean {
  const c = circuit(model, key);
  if (c.state === 'closed') return true;
  if (c.state === 'open') {
    if (model.now - c.lastFailureTime < model.config.resetTimeoutMs)
      return false;
    c.state = 'half-open';
    c.probes = 1;
    return true;
  }
  if (c.probes >= model.config.halfOpenMaxAttempts) return false;
  c.probes++;
  return true;
}

function modelFailure(model: Model, key: string): void {
  const c = circuit(model, key);
  c.failures++;
  c.lastFailureTime = model.now;
  if (c.state === 'half-open') {
    c.state = 'open';
    c.probes = 0;
    return;
  }
  if (c.state === 'closed' && c.failures >= model.config.failureThreshold) {
    c.state = 'open';
  }
}

function modelSuccess(model: Model, key: string): void {
  const c = model.circuits.get(key);
  if (!c || c.state === 'open') return;
  c.state = 'closed';
  c.failures = 0;
  c.probes = 0;
}

function assertSameStates(model: Model, real: Real): void {
  const keys = new Set([...ENDPOINTS.map(keyOf), 'never-called/']);
  const stats = real.breaker.getStats();
  for (const key of keys) {
    const expected = reportedState(model, key);
    const actual = real.breaker.getState(key);
    invariant(
      actual === expected,
      `getState("${key}") is "${actual}" but the model says "${expected}" at t=${model.now}`,
    );
    const statState = stats.circuits[key]?.state;
    invariant(
      statState === undefined || statState === actual,
      `getStats() reports "${String(statState)}" for "${key}" but getState() reports "${actual}"`,
    );
  }
  const modelOpen = [...keys].filter(
    (k) => reportedState(model, k) === 'open',
  ).length;
  invariant(
    stats.openCircuits === modelOpen,
    `getStats().openCircuits is ${stats.openCircuits} but the model has ${modelOpen} open circuits`,
  );
}

class AdvanceClock implements fc.Command<Model, Real> {
  constructor(readonly ms: number) {}
  check(): boolean {
    return true;
  }
  run(model: Model, real: Real): void {
    model.now += this.ms;
    real.clock.now += this.ms;
    assertSameStates(model, real);
  }
  toString(): string {
    return `advance(${this.ms}ms)`;
  }
}

class Attempt implements fc.Command<Model, Real> {
  constructor(readonly endpoint: string) {}
  check(): boolean {
    return true;
  }
  run(model: Model, real: Real): void {
    const key = keyOf(this.endpoint);
    const before = reportedState(model, key);
    const expected = modelAdmits(model, key);
    let admitted = true;
    try {
      real.breaker.checkCircuit(this.endpoint);
    } catch (error) {
      if (!(error instanceof CircuitOpenError)) throw error;
      admitted = false;
    }
    invariant(
      admitted === expected,
      `checkCircuit("${this.endpoint}") ${admitted ? 'admitted' : 'rejected'} a call the model ${expected ? 'admits' : 'rejects'} (state before: ${before}, half-open probes admitted: ${circuit(model, key).probes}, halfOpenMaxAttempts: ${model.config.halfOpenMaxAttempts})`,
    );
    const c = circuit(model, key);
    invariant(
      c.probes <= model.config.halfOpenMaxAttempts,
      `the model admitted ${c.probes} probes; halfOpenMaxAttempts is ${model.config.halfOpenMaxAttempts}`,
    );
    if (admitted) {
      model.inFlight.push(key);
      real.inFlight.push(this.endpoint);
    }
    assertSameStates(model, real);
  }
  toString(): string {
    return `attempt(${this.endpoint})`;
  }
}

/** Several calls arriving together, before any of them completes. */
class Burst implements fc.Command<Model, Real> {
  constructor(
    readonly endpoint: string,
    readonly count: number,
  ) {}
  check(): boolean {
    return true;
  }
  run(model: Model, real: Real): void {
    for (let i = 0; i < this.count; i++)
      new Attempt(this.endpoint).run(model, real);
  }
  toString(): string {
    return `burst(${this.endpoint} x${this.count})`;
  }
}

/** Complete an admitted call with an HTTP outcome, as executeSingleFetch does. */
class Complete implements fc.Command<Model, Real> {
  constructor(
    readonly slot: number,
    readonly status: number,
  ) {}
  check(model: Readonly<Model>): boolean {
    return model.inFlight.length > 0;
  }
  run(model: Model, real: Real): void {
    const index = this.slot % model.inFlight.length;
    const [key] = model.inFlight.splice(index, 1);
    const [endpoint] = real.inFlight.splice(index, 1);
    if (isCountableFailure(this.status)) {
      modelFailure(model, key!);
      real.breaker.recordFailure(endpoint!, this.status);
    } else {
      modelSuccess(model, key!);
      real.breaker.recordSuccess(endpoint!);
    }
    assertSameStates(model, real);
  }
  toString(): string {
    return `complete(inFlight[${this.slot}], ${this.status})`;
  }
}

/** recordFailure with any status and no admitted call behind it. */
class ReportFailure implements fc.Command<Model, Real> {
  constructor(
    readonly endpoint: string,
    readonly status: number,
  ) {}
  check(): boolean {
    return true;
  }
  run(model: Model, real: Real): void {
    if (isCountableFailure(this.status))
      modelFailure(model, keyOf(this.endpoint));
    real.breaker.recordFailure(this.endpoint, this.status);
    assertSameStates(model, real);
  }
  toString(): string {
    return `recordFailure(${this.endpoint}, ${this.status})`;
  }
}

const configArb: fc.Arbitrary<Config> = fc.record({
  failureThreshold: fc.integer({ min: 1, max: 4 }),
  resetTimeoutMs: fc.integer({ min: 1, max: 60 }),
  halfOpenMaxAttempts: fc.integer({ min: 1, max: 3 }),
});

/** Countable failures three times as often as other statuses. */
const statusArb = fc.oneof(
  { arbitrary: fc.constantFrom(0, 420, 429, 500, 502, 503, 504), weight: 3 },
  {
    arbitrary: fc.constantFrom(200, 201, 204, 304, 400, 401, 403, 404),
    weight: 1,
  },
);

function commandsFor(config: Config) {
  const endpoint = fc.constantFrom(...ENDPOINTS);
  // Weighted so that most sequences open a circuit, wait out the reset
  // timeout and then send several calls into half-open.
  return fc.commands(
    [
      fc
        .oneof(
          fc.constant(config.resetTimeoutMs),
          fc.integer({ min: 0, max: config.resetTimeoutMs * 2 }),
        )
        .map((ms) => new AdvanceClock(ms)),
      endpoint.map((e) => new Attempt(e)),
      endpoint.map((e) => new Attempt(e)),
      fc
        .tuple(endpoint, fc.integer({ min: 2, max: 4 }))
        .map(([e, count]) => new Burst(e, count)),
      fc
        .tuple(fc.nat({ max: 8 }), statusArb)
        .map(([slot, status]) => new Complete(slot, status)),
      fc
        .tuple(fc.constantFrom(...ENDPOINTS), statusArb)
        .map(([e, status]) => new ReportFailure(e, status)),
    ],
    { maxCommands: 60, size: 'medium' },
  );
}

/** Run one command sequence against a fresh breaker and the model. */
function runModel(
  factory: BreakerFactory,
  config: Config,
  commands: Iterable<fc.Command<Model, Real>>,
): void {
  const clock = { now: 1_000_000 };
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => clock.now);
  try {
    fc.modelRun(
      () => ({
        model: { config, now: clock.now, circuits: new Map(), inFlight: [] },
        real: { breaker: factory({ ...config }), clock, inFlight: [] },
      }),
      commands,
    );
  } finally {
    spy.mockRestore();
  }
}

function breakerProperty(factory: BreakerFactory) {
  return fc.property(
    configArb.chain((config) =>
      fc.tuple(fc.constant(config), commandsFor(config)),
    ),
    ([config, commands]) => runModel(factory, config, commands),
  );
}

// ── Known-bad breakers the property must reject ─────────────────────────

/** Admits one probe more than halfOpenMaxAttempts per half-open episode (esi-l38.11). */
class ExtraHalfOpenProbe extends CircuitBreaker {
  private spent = new Set<string>();
  override checkCircuit(endpoint: string): void {
    const key = keyOf(endpoint);
    const wasHalfOpen = this.getState(endpoint) === 'half-open';
    try {
      super.checkCircuit(endpoint);
    } catch (error) {
      if (wasHalfOpen && !this.spent.has(key)) {
        this.spent.add(key);
        return;
      }
      throw error;
    }
  }
  override recordSuccess(endpoint: string): void {
    this.spent.delete(keyOf(endpoint));
    super.recordSuccess(endpoint);
  }
  override recordFailure(endpoint: string, statusCode: number): void {
    this.spent.delete(keyOf(endpoint));
    super.recordFailure(endpoint, statusCode);
  }
}

/** A success recorded while the circuit is open closes it. */
class LateSuccessClosesOpenCircuit extends CircuitBreaker {
  override recordSuccess(endpoint: string): void {
    if (this.getState(endpoint) === 'open') {
      this.reset(endpoint);
      return;
    }
    super.recordSuccess(endpoint);
  }
}

describeProperty<BreakerFactory>({
  name: 'circuit breaker matches the closed/open/half-open reference model',
  file: __filename,
  subject: () => (config) => new CircuitBreaker(config),
  mutants: {
    'half-open admits one extra probe': () => (config) =>
      new ExtraHalfOpenProbe(config),
    'opens one failure late': () => (config) =>
      new CircuitBreaker({
        ...config,
        failureThreshold: (config.failureThreshold ?? 5) + 1,
      }),
    'probes before the reset timeout elapses': () => (config) =>
      new CircuitBreaker({
        ...config,
        resetTimeoutMs: Math.floor((config.resetTimeoutMs ?? 30_000) / 2),
      }),
    'late success closes an open circuit': () => (config) =>
      new LateSuccessClosesOpenCircuit(config),
    'counts 4xx as failures': () => (config) => {
      const real = new CircuitBreaker(config);
      const recordFailure = real.recordFailure.bind(real);
      real.recordFailure = (endpoint, status) =>
        recordFailure(endpoint, status >= 400 ? 500 : status);
      return real;
    },
  },
  property: breakerProperty,
});

// ── Shrunk counter-examples, kept as named examples (tests/fuzz/AGENTS.md) ──

describe('circuit breaker counter-examples', () => {
  const real: BreakerFactory = (config) => new CircuitBreaker(config);

  it('esi-l38.11: the call that moves an open circuit to half-open is its only probe', () => {
    // Shrunk from seed 641468347: the transition call was not counted, so a
    // second call was admitted with halfOpenMaxAttempts 1.
    expect(() =>
      runModel(
        real,
        { failureThreshold: 1, resetTimeoutMs: 297, halfOpenMaxAttempts: 1 },
        [
          new ReportFailure('characters/90000001/', 0),
          new AdvanceClock(297),
          new Attempt('characters/90000001/?page=2'),
          new Attempt('characters/90000001/'),
        ],
      ),
    ).not.toThrow();
  });

  it('a success from a call admitted before the circuit opened leaves it open', () => {
    // Shrunk from seed 553883299: two calls in flight, the first fails and
    // opens the circuit, the second succeeds and used to close it.
    expect(() =>
      runModel(
        real,
        { failureThreshold: 1, resetTimeoutMs: 3, halfOpenMaxAttempts: 2 },
        [
          new Attempt('status/'),
          new Attempt('status/'),
          new Complete(0, 0),
          new Complete(0, 200),
        ],
      ),
    ).not.toThrow();
  });
});
