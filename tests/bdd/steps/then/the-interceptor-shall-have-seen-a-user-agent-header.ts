import type { RequestContext } from '../../../../src/core/middleware/Middleware';
import { Then } from '../../support/steps';

Then('the interceptor shall have seen a User-Agent header', function () {
  const seen = this.values.seenRequests as RequestContext[];
  expect(seen).toHaveLength(1);
  expect(seen[0]!.headers['User-Agent']).toMatch(/\S/);
});
