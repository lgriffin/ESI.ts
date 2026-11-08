import type { SsoError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then('the SsoError shall not be retryable', function () {
  expect((this.result as SsoError).isRetryable()).toBe(false);
});
