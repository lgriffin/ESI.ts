import {
  LARGE_RESPONSE_BUDGET_MS,
  LARGE_SHIP_TYPE_COUNT,
} from '../../support/insurance';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall handle the large insurance response efficiently',
  function () {
    expect(sentRequests()).toHaveLength(1);
    expect(this.result).toHaveLength(LARGE_SHIP_TYPE_COUNT);
    expect(this.values.elapsedMs).toBeLessThan(LARGE_RESPONSE_BUDGET_MS);
    expect(this.result[0].type_id).toBe(1000);
    expect(this.result[499].type_id).toBe(1499);
    expect(this.result[499].levels[5]).toEqual({
      cost: 50000 * 32,
      name: 'Platinum',
      payout: 100000 * 32,
    });
    expect(this.result.every((item: any) => item.levels.length === 6)).toBe(
      true,
    );
  },
);
