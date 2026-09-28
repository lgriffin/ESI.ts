import { Given } from '../../support/steps';

Given(
  'an expected SDE version of {string} and an actual version of {string}',
  function (expected: string, actual: string) {
    this.values.expected = expected;
    this.values.actual = actual;
  },
);
