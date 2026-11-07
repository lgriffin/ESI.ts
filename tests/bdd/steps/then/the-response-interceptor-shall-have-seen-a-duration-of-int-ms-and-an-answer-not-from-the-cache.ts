import type { ResponseContext } from '../../../../src/core/middleware/Middleware';
import { Then } from '../../support/steps';

Then(
  'the response interceptor shall have seen a duration of {int} ms and an answer not from the cache',
  function (ms: number) {
    const seen = this.values.seenResponses as ResponseContext[];
    expect(seen).toHaveLength(1);
    expect(seen[0]!.durationMs).toBe(ms);
    expect(seen[0]!.fromCache).toBe(false);
  },
);
