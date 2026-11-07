import { clearRequest } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'the limiter has cleared a request to {word} {string}',
  async function (method: string, path: string) {
    await clearRequest(this, method, path);
    if (this.error) throw this.error;
  },
);
