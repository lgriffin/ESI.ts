/**
 * ESI.ts Example: Wallet Overview
 *
 * Demonstrates character and corporation wallet operations including
 * ISK balance, journal entries, and market transactions.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-wallet.read_character_wallet.v1     (character balance + journal + transactions)
 *   - esi-wallet.read_corporation_wallets.v1  (corporation wallet divisions)
 *
 * Usage: npm run example:wallet
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-wallet-demo' });

  try {
    console.log('Wallet Overview\n');

    // Step 1: Get ISK balance
    // Scope: esi-wallet.read_character_wallet.v1
    console.log('Fetching wallet balance...');
    const balance = await client.wallet.getCharacterWallet(CHARACTER_ID);
    console.log('ISK Balance');
    console.log('-'.repeat(40));
    console.log(`  Balance: ${balance.toLocaleString()} ISK\n`);

    // Step 2: Fetch journal and transactions in parallel
    // Scope: esi-wallet.read_character_wallet.v1
    console.log('Fetching journal & transactions...');
    const [journal, transactions] = await Promise.all([
      client.wallet.getCharacterWalletJournal(CHARACTER_ID),
      client.wallet.getCharacterWalletTransactions(CHARACTER_ID),
    ]);

    // Display recent journal entries
    console.log(`Wallet Journal (${journal.length} entries)`);
    console.log('-'.repeat(40));
    const recentJournal = journal.slice(0, 5);
    for (const entry of recentJournal) {
      const amount = entry.amount ?? 0;
      const sign = amount >= 0 ? '+' : '';
      console.log(`  ${entry.date} | ${sign}${amount.toLocaleString()} ISK | ${entry.ref_type}`);
      if (entry.description) {
        console.log(`    ${entry.description}`);
      }
    }
    if (journal.length > 5) {
      console.log(`  ... and ${journal.length - 5} more entries`);
    }

    // Display recent market transactions
    console.log(`\nMarket Transactions (${transactions.length} entries)`);
    console.log('-'.repeat(40));
    const recentTx = transactions.slice(0, 5);
    for (const tx of recentTx) {
      const action = tx.is_buy ? 'BUY' : 'SELL';
      const total = tx.unit_price * tx.quantity;
      console.log(`  ${tx.date} | ${action} | ${tx.quantity}x type ${tx.type_id} @ ${tx.unit_price.toLocaleString()} ISK (${total.toLocaleString()} ISK total)`);
    }
    if (transactions.length > 5) {
      console.log(`  ... and ${transactions.length - 5} more transactions`);
    }

    // Summary
    const totalIncome = journal
      .filter(e => (e.amount ?? 0) > 0)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const totalExpenses = journal
      .filter(e => (e.amount ?? 0) < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount ?? 0), 0);

    console.log('\nSummary');
    console.log('-'.repeat(40));
    console.log(`  Total income:   +${totalIncome.toLocaleString()} ISK`);
    console.log(`  Total expenses: -${totalExpenses.toLocaleString()} ISK`);
    console.log(`  Net change:     ${(totalIncome - totalExpenses).toLocaleString()} ISK`);

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-wallet.read_character_wallet.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
