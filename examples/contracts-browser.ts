/**
 * ESI.ts Example: Contracts Browser
 *
 * Demonstrates browsing public region contracts (no auth) and
 * fetching a character's personal contracts (auth required).
 *
 * ESI Scopes Required:
 *   - None for public contracts (getPublicContracts)
 *   - esi-contracts.read_character_contracts.v1  (character contracts)
 *
 * Usage: npm run example:contracts
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const THE_FORGE_REGION = 10000002; // Jita's region

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-contracts-demo' });

  try {
    console.log('Contracts Browser\n');

    // --- Public contracts (no auth) ---
    console.log(`Fetching public contracts in The Forge (region ${THE_FORGE_REGION})...`);
    const publicContracts = await client.contracts.getPublicContracts(THE_FORGE_REGION);
    console.log(`  Found ${publicContracts.length} public contracts\n`);

    // Break down by type
    const byType = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const c of publicContracts) {
      byType.set(c.type, (byType.get(c.type) || 0) + 1);
      if (c.status) {
        byStatus.set(c.status, (byStatus.get(c.status) || 0) + 1);
      }
    }

    console.log('Public Contracts by Type');
    console.log('-'.repeat(40));
    for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count.toLocaleString()}`);
    }

    console.log('\nPublic Contracts by Status');
    console.log('-'.repeat(40));
    for (const [status, count] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${status}: ${count.toLocaleString()}`);
    }

    // Show a sample auction contract with bids
    const auctions = publicContracts.filter(c => c.type === 'auction');
    if (auctions.length > 0) {
      const auction = auctions[0];
      console.log(`\nSample Auction Contract #${auction.contract_id}`);
      console.log('-'.repeat(40));
      console.log(`  Price:       ${auction.price?.toLocaleString() || 0} ISK`);
      console.log(`  Buyout:      ${auction.buyout?.toLocaleString() || 'none'} ISK`);
      console.log(`  Volume:      ${auction.volume?.toLocaleString() || 'N/A'} m3`);
      console.log(`  Expires:     ${auction.date_expired}`);

      try {
        const bids = await client.contracts.getPublicContractBids(auction.contract_id);
        console.log(`  Bids:        ${bids.length}`);
        if (bids.length > 0) {
          const topBid = bids.sort((a, b) => b.amount - a.amount)[0];
          console.log(`  Highest bid: ${topBid.amount.toLocaleString()} ISK`);
        }
      } catch {
        console.log('  Bids:        unavailable');
      }

      try {
        const items = await client.contracts.getPublicContractItems(auction.contract_id);
        console.log(`  Items:       ${items.length}`);
        for (const item of items.slice(0, 3)) {
          const label = item.is_included ? 'included' : 'requested';
          console.log(`    Type ${item.type_id} x${item.quantity} (${label})`);
        }
        if (items.length > 3) {
          console.log(`    ... and ${items.length - 3} more items`);
        }
      } catch {
        console.log('  Items:       unavailable');
      }
    }

    // --- Character contracts (requires auth) ---
    // Scope: esi-contracts.read_character_contracts.v1
    console.log('\n--- Character Contracts ---');
    try {
      const characterId = 1689391488;
      const myContracts = await client.contracts.getCharacterContracts(characterId);
      console.log(`Found ${myContracts.length} personal contracts`);

      if (myContracts.length > 0) {
        const recent = myContracts.slice(0, 5);
        console.log('-'.repeat(40));
        for (const c of recent) {
          console.log(`  #${c.contract_id} | ${c.type} | ${c.status} | ${c.price?.toLocaleString() || 0} ISK`);
        }
        if (myContracts.length > 5) {
          console.log(`  ... and ${myContracts.length - 5} more contracts`);
        }
      }
    } catch (err) {
      if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
        console.log('Skipped: ESI_ACCESS_TOKEN not set or missing scope esi-contracts.read_character_contracts.v1');
      } else {
        throw err;
      }
    }

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
