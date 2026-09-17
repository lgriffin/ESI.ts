/**
 * A deliberately weak fault. It injects a real failure but asserts only that
 * "something goes wrong": a message pattern that matches anything, no request
 * count, no cache state, an unbounded time window, no logs, and a Rule that
 * does not exist. catalogue.selftest.test.ts requires the validator to reject
 * every one of those; if it accepts this fault, the gate has stopped working.
 *
 * Not part of the catalogue.
 */
import type { Fault } from '../types';

export const WEAK_FAULT = {
  id: 'Weak_Fault',
  title: 'something goes wrong',
  rule: {
    feature: 'core/0051-resilience.feature',
    rule: 'The EsiClient shall handle errors.',
  },
  exchange: () => [{ status: 503, body: 'down' }],
  expected: () => ({
    settlement: { rejects: { class: 'Error', message: /.*/ } },
    elapsedMs: { min: 0, max: Infinity },
  }),
} as unknown as Fault;
