import { clearRequest } from '../../support/rate-limiter';
import { When } from '../../support/steps';

When(
  'the limiter is asked to clear a request it refuses to {word} {string}',
  async function (method: string, path: string) {
    await clearRequest(this, method, path, undefined, true);
  },
);
