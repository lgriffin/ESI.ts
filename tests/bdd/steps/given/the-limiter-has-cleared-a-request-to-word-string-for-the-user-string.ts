import { clearRequest } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'the limiter has cleared a request to {word} {string} for the user {string}',
  async function (method: string, path: string, user: string) {
    await clearRequest(this, method, path, user);
    if (this.error) throw this.error;
  },
);
