import { RAISED_ERRORS, guardsSatisfiedBy } from '../../support/error-guards';
import { When } from '../../support/steps';

When(
  'an application classifies a {string} with every error type guard',
  function (kind: string) {
    const raise = RAISED_ERRORS[kind];
    if (!raise)
      throw new Error(`No error of kind "${kind}" in error-guards.ts`);
    this.result = guardsSatisfiedBy(raise());
  },
);
