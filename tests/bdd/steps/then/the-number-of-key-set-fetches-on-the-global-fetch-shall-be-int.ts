import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the number of key set fetches on the global fetch shall be {int}',
  function (count: number) {
    const fetches = sentRequests().filter(
      (r) => r.url.pathname === '/oauth/jwks',
    );
    expect(fetches).toHaveLength(count);
  },
);
