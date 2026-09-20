import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client gathers all financial data', async function () {
  const [balance, journal, transactions] = await Promise.all([
    this.client.wallet.getCharacterWallet(WALLET_CHARACTER_ID),
    this.client.wallet.getCharacterWalletJournal(WALLET_CHARACTER_ID),
    this.client.wallet.getCharacterWalletTransactions(WALLET_CHARACTER_ID),
  ]);
  Object.assign(this.values, { balance, journal, transactions });
});
