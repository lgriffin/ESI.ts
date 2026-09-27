import { headerOf } from '../../support/request-headers';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  "the two requests shall carry the provider's first and second tokens",
  function () {
    const bearers = sentRequests().map((r) =>
      headerOf(r.headers, 'Authorization'),
    );
    expect(bearers).toEqual([
      'Bearer provider-token-1',
      'Bearer provider-token-2',
    ]);
  },
);
