import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('all wallet data shall complete successfully', function () {
  const { balance, journal, transactions } = this.values;
  expect(sentRequests()).toHaveLength(3);
  expect(balance).toBe(5250000000.75);
  expect(journal.map((e: any) => e.id)).toEqual([1000000001]);
  expect(journal[0].amount).toBe(1000000.0);
  expect(transactions.map((t: any) => t.transaction_id)).toEqual([123456789]);
});
