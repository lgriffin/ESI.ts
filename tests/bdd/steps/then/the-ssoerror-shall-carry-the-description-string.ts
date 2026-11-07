import type { SsoError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then(
  'the SsoError shall carry the description {string}',
  function (description: string) {
    expect((this.error as SsoError).errorDescription).toBe(description);
  },
);
