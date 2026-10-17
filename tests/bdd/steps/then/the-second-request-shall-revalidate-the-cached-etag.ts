import { headerOf } from '../../support/request-headers';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the second request shall revalidate the cached ETag', function () {
  expect(headerOf(sentRequests()[1]!.headers, 'If-None-Match')).toBe(
    '"status-v1"',
  );
});
