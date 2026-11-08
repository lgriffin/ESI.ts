import { readResponse } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given(
  'the limiter has read a {int} response to {word} {string} with the headers {string}',
  function (status: number, method: string, path: string, headers: string) {
    readResponse(this, status, method, path, headers);
  },
);
