import { CURSOR_TOKEN } from '../../support/corporation-projects';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the request shall carry the cursor token as the after query parameter',
  function () {
    expect(sentRequests()).toHaveLength(1);
    const query = lastRequest().url.searchParams;
    expect(query.get('after')).toBe(CURSOR_TOKEN);
    expect(query.has('before')).toBe(false);
  },
);
