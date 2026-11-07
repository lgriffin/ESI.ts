import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the last request to ESI shall carry the bearer token {string}',
  function (token: string) {
    expect(this.error).toBeUndefined();
    expect(lastRequest().headers.authorization).toBe(`Bearer ${token}`);
  },
);
