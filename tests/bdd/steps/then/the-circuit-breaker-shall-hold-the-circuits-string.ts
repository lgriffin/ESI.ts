import { breakerOf } from '../../support/circuit-breaker';
import { Then } from '../../support/steps';

Then(
  'the circuit breaker shall hold the circuits {string}',
  function (list: string) {
    const held = Object.keys(breakerOf(this).getStats().circuits);
    expect(held.toSorted()).toEqual(list.split(', ').toSorted());
  },
);
