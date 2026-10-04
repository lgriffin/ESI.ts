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

const THE_FORGE_REGION = 10000002; // Jita's region

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-contracts-demo',
  });

  try {
    log.info('Contracts Browser\n');

    // --- Public contracts (no auth) ---
    log.info(
      `Fetching public contracts in The Forge (region ${THE_FORGE_REGION})...`,
    );
    const publicContracts =
      await client.contracts.getPublicContracts(THE_FORGE_REGION);
    log.info(`  Found ${publicContracts.length} public contracts\n`);

    // Break down by type. ESI lists only outstanding public contracts and
    // sends no status field on them.
    const byType = new Map<string, number>();
    for (const c of publicContracts) {
      byType.set(c.type, (byType.get(c.type) || 0) + 1);
    }

    log.info('Public Contracts by Type');
    log.info('-'.repeat(40));
    for (const [type, count] of [...byType.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      log.info(`  ${type}: ${count.toLocaleString()}`);
    }

    // Show a sample auction contract with bids
    const auctions = publicContracts.filter((c) => c.type === 'auction');
    if (auctions.length > 0) {
      const auction = auctions[0]!;
      log.info(`\nSample Auction Contract #${auction.contract_id}`);
      log.info('-'.repeat(40));
      log.info(`  Price:       ${auction.price?.toLocaleString() || 0} ISK`);
      log.info(
        `  Buyout:      ${auction.buyout?.toLocaleString() || 'none'} ISK`,
      );
      log.info(
        `  Volume:      ${auction.volume?.toLocaleString() || 'N/A'} m3`,
      );
      log.info(`  Expires:     ${auction.date_expired}`);

      try {
        const bids = await client.contracts.getPublicContractBids(
          auction.contract_id,
        );
        log.info(`  Bids:        ${bids.length}`);
        if (bids.length > 0) {
          const topBid = bids.sort((a, b) => b.amount - a.amount)[0]!;
          log.info(`  Highest bid: ${topBid.amount.toLocaleString()} ISK`);
        }
      } catch {
        log.info('  Bids:        unavailable');
      }

      try {
        const items = await client.contracts.getPublicContractItems(
          auction.contract_id,
        );
        log.info(`  Items:       ${items.length}`);
        for (const item of items.slice(0, 3)) {
          const label = item.is_included ? 'included' : 'requested';
          log.info(`    Type ${item.type_id} x${item.quantity} (${label})`);
        }
        if (items.length > 3) {
          log.info(`    ... and ${items.length - 3} more items`);
        }
      } catch {
        log.info('  Items:       unavailable');
      }
    }

    // --- Character contracts (requires auth) ---
    // Scope: esi-contracts.read_character_contracts.v1
    log.info('\n--- Character Contracts ---');
    try {
      const characterId = 1689391488;
      const myContracts =
        await client.contracts.getCharacterContracts(characterId);
      log.info(`Found ${myContracts.length} personal contracts`);

      if (myContracts.length > 0) {
        const recent = myContracts.slice(0, 5);
        log.info('-'.repeat(40));
        for (const c of recent) {
          log.info(
            `  #${c.contract_id} | ${c.type} | ${c.status} | ${c.price?.toLocaleString() || 0} ISK`,
          );
        }
        if (myContracts.length > 5) {
          log.info(`  ... and ${myContracts.length - 5} more contracts`);
        }
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('NO_AUTH_TOKEN') ||
          (err instanceof EsiError &&
            (err.statusCode === 401 || err.statusCode === 403)))
      ) {
        log.info(
          'Skipped: ESI_ACCESS_TOKEN not set or missing scope esi-contracts.read_character_contracts.v1',
        );
      } else {
        throw err;
      }
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
