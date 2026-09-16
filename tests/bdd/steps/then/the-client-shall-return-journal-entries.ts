import { WALLET_CHARACTER_ID, walletPaths } from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return journal entries', function () {
  expect(lastRequest().url.pathname).toBe(
    walletPaths.journal(WALLET_CHARACTER_ID),
  );
  expect(
    this.result.map((e: any) => ({
      id: e.id,
      date: e.date,
      ref_type: e.ref_type,
      amount: e.amount,
      balance: e.balance,
    })),
  ).toEqual([
    {
      id: 1000000001,
      date: '2024-01-15T12:00:00Z',
      ref_type: 'market_transaction',
      amount: 1000000.0,
      balance: 5250000000.75,
    },
    {
      id: 1000000002,
      date: '2024-01-15T11:30:00Z',
      ref_type: 'bounty_prizes',
      amount: 500000.0,
      balance: 5249000000.75,
    },
  ]);
});
