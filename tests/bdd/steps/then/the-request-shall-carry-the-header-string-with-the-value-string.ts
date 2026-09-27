import { headerOf } from '../../support/request-headers';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request shall carry the header {string} with the value {string}',
  function (name: string, value: string) {
    expect(headerOf(lastRequest().headers, name)).toBe(value);
  },
);
