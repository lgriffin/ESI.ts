import { loggedRequestUrls } from '../../support/logging';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the logged request URL shall carry {string} with the value {string}',
  function (name: string, value: string) {
    const urls = loggedRequestUrls(this.values.logger);
    expect(urls).toHaveLength(1);
    const logged = urls[0]!;
    expect(logged.searchParams.get(name)).toBe(value);
    // The request itself went out with the real value; only the log hides it.
    const sent = lastRequest().url;
    expect(sent.searchParams.has(name)).toBe(true);
    expect(sent.searchParams.get(name)).not.toBe(value);
    expect(logged.pathname).toBe(sent.pathname);
  },
);
