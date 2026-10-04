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
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-wallet-demo',
  });

  try {
    log.info('Wallet Overview\n');

    // Step 1: Get ISK balance
    // Scope: esi-wallet.read_character_wallet.v1
    log.info('Fetching wallet balance...');
    const balance = await client.wallet.getCharacterWallet(CHARACTER_ID);
    log.info('ISK Balance');
    log.info('-'.repeat(40));
    log.info(`  Balance: ${balance.toLocaleString()} ISK\n`);

    // Step 2: Fetch journal and transactions in parallel
    // Scope: esi-wallet.read_character_wallet.v1
    log.info('Fetching journal & transactions...');
    const [journal, transactions] = await Promise.all([
      client.wallet.getCharacterWalletJournal(CHARACTER_ID),
      client.wallet.getCharacterWalletTransactions(CHARACTER_ID),
    ]);

    // Display recent journal entries
    log.info(`Wallet Journal (${journal.length} entries)`);
    log.info('-'.repeat(40));
    const recentJournal = journal.slice(0, 5);
    for (const entry of recentJournal) {
      const amount = entry.amount ?? 0;
      const sign = amount >= 0 ? '+' : '';
      log.info(
        `  ${entry.date} | ${sign}${amount.toLocaleString()} ISK | ${entry.ref_type}`,
      );
      if (entry.description) {
        log.info(`    ${entry.description}`);
      }
    }
    if (journal.length > 5) {
      log.info(`  ... and ${journal.length - 5} more entries`);
    }

    // Display recent market transactions
    log.info(`\nMarket Transactions (${transactions.length} entries)`);
    log.info('-'.repeat(40));
    const recentTx = transactions.slice(0, 5);
    for (const tx of recentTx) {
      const action = tx.is_buy ? 'BUY' : 'SELL';
      const total = tx.unit_price * tx.quantity;
      log.info(
        `  ${tx.date} | ${action} | ${tx.quantity}x type ${tx.type_id} @ ${tx.unit_price.toLocaleString()} ISK (${total.toLocaleString()} ISK total)`,
      );
    }
    if (transactions.length > 5) {
      log.info(`  ... and ${transactions.length - 5} more transactions`);
    }

    // Summary
    const totalIncome = journal
      .filter((e) => (e.amount ?? 0) > 0)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const totalExpenses = journal
      .filter((e) => (e.amount ?? 0) < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount ?? 0), 0);

    log.info('\nSummary');
    log.info('-'.repeat(40));
    log.info(`  Total income:   +${totalIncome.toLocaleString()} ISK`);
    log.info(`  Total expenses: -${totalExpenses.toLocaleString()} ISK`);
    log.info(
      `  Net change:     ${(totalIncome - totalExpenses).toLocaleString()} ISK`,
    );
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-wallet.read_character_wallet.v1',
      );
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
