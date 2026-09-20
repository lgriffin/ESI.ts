/**
 * ESI.ts Example: Contracts, Contacts, Assets & Wallet
 *
 * Demonstrates character contract bids/items, corporation contracts,
 * alliance/corporation contacts, corporation assets, corporation
 * wallets (journal + transactions), and public structure lookup.
 *
 * Most corporation endpoints require director roles and will gracefully
 * skip with a message if the token lacks permission.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:corp-contracts-wallet
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;
const ALLIANCE_ID = 99000001;

async function tryOrSkip(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 403 || err.statusCode === 401)
    ) {
      console.log(`  ${label}: requires corporation/alliance roles — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Contracts, Contacts, Assets & Wallet\n');

    // --- Character Contract Bids & Items ---
    console.log('Character Contract Bids & Items');
    console.log('-'.repeat(50));
    const charContracts =
      await client.contracts.getCharacterContracts(CHARACTER_ID);
    console.log(`  Character contracts: ${charContracts.length}`);
    if (charContracts.length > 0) {
      const first = charContracts[0]!;
      console.log(
        `  First contract: ${first.contract_id} (${first.type}, ${first.status})`,
      );

      try {
        const bids = await client.contracts.getCharacterContractBids(
          CHARACTER_ID,
          first.contract_id,
        );
        console.log(`    Bids: ${bids.length}`);
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          console.log('    Bids: N/A (not an auction)');
        } else {
          throw err;
        }
      }

      try {
        const items = await client.contracts.getCharacterContractItems(
          CHARACTER_ID,
          first.contract_id,
        );
        console.log(`    Items: ${items.length}`);
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          console.log('    Items: N/A');
        } else {
          throw err;
        }
      }
    } else {
      console.log('  No contracts found');
    }

    // --- Corporation Contracts ---
    console.log('\nCorporation Contracts');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp contracts', async () => {
      const corpContracts =
        await client.contracts.getCorporationContracts(CORP_ID);
      console.log(`  Corporation contracts: ${corpContracts.length}`);
      if (corpContracts.length > 0) {
        const first = corpContracts[0]!;
        console.log(
          `  First: ${first.contract_id} (${first.type}, ${first.status})`,
        );

        try {
          const bids = await client.contracts.getCorporationContractBids(
            CORP_ID,
            first.contract_id,
          );
          console.log(`    Bids: ${bids.length}`);
        } catch (err) {
          if (err instanceof EsiError && err.statusCode === 404) {
            console.log('    Bids: N/A (not an auction)');
          } else {
            throw err;
          }
        }

        try {
          const items = await client.contracts.getCorporationContractItems(
            CORP_ID,
            first.contract_id,
          );
          console.log(`    Items: ${items.length}`);
        } catch (err) {
          if (err instanceof EsiError && err.statusCode === 404) {
            console.log('    Items: N/A');
          } else {
            throw err;
          }
        }
      }
    });

    // --- Alliance Contacts ---
    console.log('\nAlliance Contacts');
    console.log('-'.repeat(50));
    await tryOrSkip('Alliance contacts', async () => {
      const contacts = await client.contacts.getAllianceContacts(ALLIANCE_ID);
      console.log(`  Alliance contacts: ${contacts.length}`);
    });
    await tryOrSkip('Alliance contact labels', async () => {
      const labels =
        await client.contacts.getAllianceContactLabels(ALLIANCE_ID);
      console.log(`  Alliance contact labels: ${labels.length}`);
    });

    // --- Corporation Contacts ---
    console.log('\nCorporation Contacts');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp contacts', async () => {
      const contacts = await client.contacts.getCorporationContacts(CORP_ID);
      console.log(`  Corporation contacts: ${contacts.length}`);
    });
    await tryOrSkip('Corp contact labels', async () => {
      const labels = await client.contacts.getCorporationContactLabels(CORP_ID);
      console.log(`  Corporation contact labels: ${labels.length}`);
    });

    // --- Corporation Assets ---
    console.log('\nCorporation Assets');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp assets', async () => {
      const assets = await client.assets.getCorporationAssets(CORP_ID);
      console.log(`  Corporation assets: ${assets.length}`);
      for (const a of assets.slice(0, 5)) {
        console.log(
          `    Type ${a.type_id}: qty ${a.quantity} in ${a.location_type} ${a.location_id}`,
        );
      }
      if (assets.length > 5)
        console.log(`    ... and ${assets.length - 5} more`);
    });

    // --- Corporation Wallets ---
    console.log('\nCorporation Wallets');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp wallets', async () => {
      const wallets = await client.wallet.getCorporationWallets(CORP_ID);
      console.log(`  Wallet divisions: ${wallets.length}`);
      for (const w of wallets) {
        console.log(
          `    Division ${w.division}: ${w.balance.toLocaleString()} ISK`,
        );
      }

      if (wallets.length > 0) {
        const div = wallets[0]!.division;
        const journal = await client.wallet.getCorporationWalletJournal(
          CORP_ID,
          div,
        );
        console.log(`\n  Division ${div} journal entries: ${journal.length}`);
        for (const entry of journal.slice(0, 3)) {
          console.log(
            `    ${entry.date}: ${entry.ref_type} — ${entry.amount?.toLocaleString() ?? 0} ISK`,
          );
        }
        if (journal.length > 3)
          console.log(`    ... and ${journal.length - 3} more`);

        const txns = await client.wallet.getCorporationWalletTransactions(
          CORP_ID,
          div,
        );
        console.log(`\n  Division ${div} transactions: ${txns.length}`);
        for (const tx of txns.slice(0, 3)) {
          console.log(
            `    ${tx.date}: type ${tx.type_id} x${tx.quantity} @ ${tx.unit_price.toLocaleString()} ISK`,
          );
        }
        if (txns.length > 3) console.log(`    ... and ${txns.length - 3} more`);
      }
    });

    // --- Structures (public list + detail) ---
    console.log('\nPublic Structures');
    console.log('-'.repeat(50));
    try {
      const structureIds = await client.universe.getStructures();
      console.log(`  Public structure IDs: ${structureIds.length}`);

      if (structureIds.length > 0) {
        try {
          const detail = await client.universe.getStructureById(
            structureIds[0]!,
          );
          console.log(`  Structure ${structureIds[0]}: ${detail.name}`);
          console.log(
            `    System: ${detail.solar_system_id}, Type: ${detail.type_id ?? 'N/A'}`,
          );
        } catch (err) {
          if (
            err instanceof EsiError &&
            (err.statusCode === 403 || err.statusCode === 401)
          ) {
            console.log('  Structure detail requires docking access — skipped');
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 403 || err.statusCode === 401)
      ) {
        console.log('  Requires authentication — skipped');
      } else {
        throw err;
      }
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
