import { TRITANIUM } from '../../support/market';
import { Then } from '../../support/steps';

Then(
  'the client shall successfully retrieve all market information',
  function () {
    expect(this.values.prices).toEqual([
      expect.objectContaining({ type_id: TRITANIUM, average_price: 4.5 }),
    ]);
    expect(this.values.orders.map((o: any) => o.price)).toEqual([4.45, 4.55]);
    expect(this.values.history).toEqual([
      expect.objectContaining({ date: '2024-01-15', average: 4.5 }),
    ]);
  },
);
