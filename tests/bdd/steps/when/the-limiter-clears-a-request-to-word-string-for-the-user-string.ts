import { clearRequest } from '../../support/rate-limiter';
import { When } from '../../support/steps';

When(
  'the limiter clears a request to {word} {string} for the user {string}',
  async function (method: string, path: string, user: string) {
    await clearRequest(this, method, path, user);
  },
);
