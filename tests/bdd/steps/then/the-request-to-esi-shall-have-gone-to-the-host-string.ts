import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request to ESI shall have gone to the host {string}',
  function (host: string) {
    expect(this.error).toBeUndefined();
    expect(lastRequest().url.host).toBe(host);
  },
);
