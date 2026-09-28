import { EXPECTED_GUARD_VERDICTS } from '../../support/sde';
import { Then } from '../../support/steps';

Then(
  'each guard shall correctly identify its matching error type',
  function () {
    expect(this.result).toEqual(EXPECTED_GUARD_VERDICTS);
  },
);
