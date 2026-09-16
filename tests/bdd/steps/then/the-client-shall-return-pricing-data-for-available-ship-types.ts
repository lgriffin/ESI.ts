import {
  INSURANCE_PRICES_MATCH,
  insuranceFixtures,
} from '../../support/insurance';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return pricing data for available ship types',
  function () {
    const request = lastRequest();
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toMatch(INSURANCE_PRICES_MATCH);
    expect(request.headers.authorization).toBeUndefined();
    expect(sentRequests()).toHaveLength(1);

    expect(this.result).toEqual(insuranceFixtures.frigateAndBattleship());
    expect(this.result.map((p: any) => p.type_id)).toEqual([587, 29984]);
    expect(this.result[0].levels[0]).toEqual({
      cost: 10,
      name: 'Basic',
      payout: 20,
    });
    expect(this.result[1].levels[5]).toEqual({
      cost: 40000000,
      name: 'Platinum',
      payout: 80000000,
    });
  },
);
