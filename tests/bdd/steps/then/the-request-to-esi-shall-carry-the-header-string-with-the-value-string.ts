import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request to ESI shall carry the header {string} with the value {string}',
  function (name: string, value: string) {
    expect(this.error).toBeUndefined();
    expect(lastRequest().headers[name]).toBe(value);
  },
);
