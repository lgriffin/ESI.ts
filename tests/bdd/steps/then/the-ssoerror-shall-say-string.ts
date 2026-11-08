import type { SsoError } from '../../../../src/auth/errors';
import { Then } from '../../support/steps';

Then('the SsoError shall say {string}', function (text: string) {
  expect((this.error as SsoError).message).toContain(text);
});
