import { Then } from '../../support/steps';

Then('the client shall compute a financial summary', function () {
  const { balance, journal, transactions } = this.values;
  const totalIncome = journal
    .filter((entry: any) => entry.amount > 0)
    .reduce((sum: number, entry: any) => sum + entry.amount, 0);
  const totalExpenses = journal
    .filter((entry: any) => entry.amount < 0)
    .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
  const buyTransactions = transactions.filter((t: any) => t.is_buy === true);
  const sellTransactions = transactions.filter((t: any) => t.is_buy === false);

  expect(balance).toBe(5250000000.75);
  expect(totalIncome).toBe(1500000.0);
  expect(totalExpenses).toBe(200000.0);
  expect(buyTransactions.map((t: any) => t.transaction_id)).toEqual([
    123456790,
  ]);
  expect(sellTransactions.map((t: any) => t.transaction_id)).toEqual([
    123456789,
  ]);
});
