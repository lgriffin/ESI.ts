import type { EsiError } from '../../../../src/core/util/error';
import { RAISED_ERRORS } from '../../support/error-guards';
import { When } from '../../support/steps';

When(
  'an application asks a {string} whether it is a timeout',
  function (kind: string) {
    const raise = RAISED_ERRORS[kind];
    if (!raise)
      throw new Error(`No error of kind "${kind}" in error-guards.ts`);
    this.result = (raise() as EsiError).isTimeout();
  },
);
