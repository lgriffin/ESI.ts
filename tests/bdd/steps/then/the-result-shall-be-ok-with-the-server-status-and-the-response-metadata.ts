import { serverStatus } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then(
  'the result shall be ok with the server status and the response metadata',
  function () {
    expect(this.error).toBeUndefined();
    const result = this.result as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(serverStatus());
    expect(result.meta).toMatchObject({ fromCache: false });
  },
);
