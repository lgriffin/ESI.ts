import { clearRequest } from '../../support/rate-limiter';
import { When } from '../../support/steps';

When(
  'the limiter clears a request to {word} {string}',
  async function (method: string, path: string) {
    await clearRequest(this, method, path);
  },
);
