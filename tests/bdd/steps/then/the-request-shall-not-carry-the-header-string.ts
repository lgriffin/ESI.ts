import { headerOf } from '../../support/request-headers';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request shall not carry the header {string}',
  function (name: string) {
    expect(this.result).toBeDefined();
    expect(headerOf(lastRequest().headers, name)).toBeUndefined();
  },
);
