import { breakerOf } from '../../support/circuit-breaker';
import { Then } from '../../support/steps';

Then(
  'the circuit for {string} shall be {word}',
  function (endpoint: string, state: string) {
    expect(breakerOf(this).getState(endpoint)).toBe(state);
  },
);
