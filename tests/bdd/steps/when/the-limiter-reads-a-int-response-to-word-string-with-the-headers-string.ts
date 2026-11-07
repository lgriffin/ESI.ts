import { readResponse } from '../../support/rate-limiter';
import { When } from '../../support/steps';

When(
  'the limiter reads a {int} response to {word} {string} with the headers {string}',
  function (status: number, method: string, path: string, headers: string) {
    readResponse(this, status, method, path, headers);
  },
);
