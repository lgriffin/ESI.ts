/**
 * ESI.ts Example: Public Contracts
 *
 * Lists the public contracts in a region, then reads the items of the first
 * item exchange and the bids on the first auction.
 *
 * No authentication required.
 *
 * Usage: npm run example:public-contracts
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const THE_FORGE = 10000002;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    const contracts = await client.contracts.getPublicContracts(THE_FORGE);
    const byType = new Map<string, number>();
    for (const contract of contracts) {
      byType.set(contract.type, (byType.get(contract.type) ?? 0) + 1);
    }
    log.info(`Public contracts in The Forge: ${contracts.length}`);
    for (const [type, count] of byType) log.info(`  ${type}: ${count}`);

    const exchange = contracts.find((c) => c.type === 'item_exchange');
    if (exchange) {
      const items = await client.contracts.getPublicContractItems(
        exchange.contract_id,
      );
      log.info(
        `\nItem exchange ${exchange.contract_id}: ${items.length} item line(s)`,
      );
      for (const item of items.slice(0, 5)) {
        const side = item.is_included ? 'offered' : 'wanted';
        log.info(`  ${item.quantity} x type ${item.type_id} (${side})`);
      }
    }

    const auction = contracts.find((c) => c.type === 'auction');
    if (auction) {
      const bids = await client.contracts.getPublicContractBids(
        auction.contract_id,
      );
      const top = bids.reduce((max, bid) => Math.max(max, bid.amount), 0);
      log.info(
        `\nAuction ${auction.contract_id}: ${bids.length} bid(s), highest ${top.toLocaleString()} ISK`,
      );
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
