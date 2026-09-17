/**
 * Composition: retry inside a circuit that has just opened.
 *
 * Two calls to one endpoint retry 503s while their failures open the circuit
 * breaker between them. Whatever order the sends, responses and backoff
 * timers take, no request may leave once the circuit is open, a retry that
 * finds it open must end the call instead of backing off again, and a call
 * after both have settled is refused without a request.
 *
 * Backs these Rules in tests/bdd/features/core/0051-resilience.feature:
 *   - "If the circuit opens while a call is still retrying, then the EsiClient
 *     shall reject that call with CircuitOpenError and issue no further
 *     attempt."
 *   - "While the circuit for an endpoint is open, the EsiClient shall reject
 *     calls to that endpoint with CircuitOpenError without issuing an HTTP
 *     request."
 */
import { EsiClient } from '../../../src/EsiClient';
import { Scenario, explore } from './support/interleave';
import {
  createPipelineClient,
  describeOutcome,
  expectExplored,
  isCircuitOpen,
  scenarioOptions,
} from './support/world';

const THRESHOLD = 2;

interface World {
  client: EsiClient;
}

function scenario(name: string, dedupe: boolean): Scenario<World> {
  return {
    name,
    setup: async () => ({
      client: createPipelineClient({
        enableRequestDeduplication: dedupe,
        circuitBreakerConfig: {
          failureThreshold: THRESHOLD,
          resetTimeoutMs: 30_000,
        },
      }),
    }),
    teardown: (w) => w.client.shutdown(),
    actors: [
      { name: 'A', run: (w) => w.client.status.getStatus() },
      { name: 'B', run: (w) => w.client.status.getStatus() },
    ],
    followUp: [{ name: 'late', run: (w) => w.client.status.getStatus() }],
    respond: () => ({ status: 503, body: { error: 'service unavailable' } }),
    invariants: {
      'no request is sent after the circuit has opened': (trace) => {
        let failures = 0;
        for (const event of trace.events) {
          if (event.kind === 'deliver') failures += 1;
          if (event.kind === 'send' && failures >= THRESHOLD) {
            return `${event.label} left after ${failures} delivered 503s had opened the circuit`;
          }
        }
        return undefined;
      },
      'every concurrent call rejects with CircuitOpenError': (trace) => {
        for (const actor of ['A', 'B']) {
          const outcome = trace.outcomes.get(actor);
          if (!isCircuitOpen(outcome)) {
            return `${actor} ${describeOutcome(outcome)}`;
          }
        }
        return undefined;
      },
      'a retry that finds the circuit open does not back off again': (
        trace,
      ) => {
        // When the circuit opens, each unsettled call can be in at most one
        // backoff. Waking from it finds the circuit open and ends the call,
        // so no more timers than that may fire afterwards.
        let failures = 0;
        let opened = -1;
        trace.events.forEach((event, index) => {
          if (event.kind === 'deliver' && ++failures === THRESHOLD) {
            opened = index;
          }
        });
        if (opened === -1) return `the circuit never opened (${failures} 503s)`;
        const after = trace.events.slice(opened + 1);
        const unsettled = ['A', 'B'].filter(
          (actor) =>
            !trace.events
              .slice(0, opened + 1)
              .some((e) => e.kind === 'settle' && e.actor === actor),
        ).length;
        const fired = after.reduce((sum, e) => sum + (e.fired ?? 0), 0);
        return fired <= unsettled
          ? undefined
          : `${fired} backoff timers fired after the circuit opened, for ${unsettled} unsettled call(s)`;
      },
      'a call after both settle is refused without a request': (trace) => {
        const late = trace.outcomes.get('late');
        const lateRequests = trace.requests.filter(
          (r) => r.phase === 'follow-up',
        );
        if (!isCircuitOpen(late)) return `late ${describeOutcome(late)}`;
        return lateRequests.length === 0
          ? undefined
          : `late call sent ${lateRequests.length} request(s)`;
      },
    },
  };
}

describe('composition: retry inside a circuit that has just opened', () => {
  it.each([
    ['without deduplication', false, 42],
    ['with deduplication', true, 12],
  ])(
    'two retrying status calls %s never send into the open circuit',
    async (label, dedupe, pinned) => {
      const testName = `two retrying status calls ${label} never send into the open circuit`;
      const options = scenarioOptions(testName);
      const report = await explore(scenario(testName, dedupe), options);
      expectExplored(report, pinned, options);
    },
  );
});
