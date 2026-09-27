import { headerOf } from '../../support/request-headers';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  "the request's User-Agent header shall start with {string}",
  function (prefix: string) {
    const userAgent = headerOf(lastRequest().headers, 'User-Agent') ?? '';
    expect(userAgent.startsWith(prefix)).toBe(true);
    // The library's own identifier follows the application's.
    expect(userAgent.length).toBeGreaterThan(prefix.length);
  },
);
