import { Then } from '../../support/steps';

Then('the client shall return completed and cancelled orders', function () {
  expect(this.result).toHaveLength(1);
  expect(this.result[0].order_id).toBe(5000000001);
  expect(['cancelled', 'expired']).toContain(this.result[0].state);
  expect(this.result[0].volume_remain).toBeLessThanOrEqual(
    this.result[0].volume_total,
  );
});
