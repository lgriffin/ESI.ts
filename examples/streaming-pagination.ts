/**
 * ESI.ts Example: Streaming Pagination
 *
 * Demonstrates streaming through large paginated datasets page-by-page
 * instead of loading everything into memory at once.
 *
 * Uses market orders in The Forge (Jita's region) — one of the largest
 * paginated datasets in ESI, often 300+ pages.
 *
 * Usage: npm run example:streaming
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const FORGE_REGION_ID = 10000002;

async function streamAllOrders() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-streaming-demo',
  });

  try {
    log.info('='.repeat(60));
    log.info('Streaming Market Orders — The Forge (all pages)');
    log.info('='.repeat(60));
    log.info('');

    let totalOrders = 0;
    let buyOrders = 0;
    let sellOrders = 0;
    const startTime = Date.now();

    for await (const page of client.market.streamMarketOrders(
      FORGE_REGION_ID,
    )) {
      totalOrders += page.data.length;
      for (const order of page.data) {
        if (order.is_buy_order) buyOrders++;
        else sellOrders++;
      }

      log.info(
        `  Page ${page.page}/${page.totalPages}: ` +
          `${page.data.length} orders ` +
          `(total so far: ${totalOrders.toLocaleString()})`,
      );
    }

    const elapsed = Date.now() - startTime;
    log.info('');
    log.info(`Done in ${(elapsed / 1000).toFixed(1)}s`);
    log.info(`  Total orders: ${totalOrders.toLocaleString()}`);
    log.info(`  Buy orders:   ${buyOrders.toLocaleString()}`);
    log.info(`  Sell orders:  ${sellOrders.toLocaleString()}`);
  } finally {
    client.shutdown();
  }
}

async function streamWithEarlyStop() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-streaming-demo',
  });

  try {
    log.info('');
    log.info('='.repeat(60));
    log.info('Streaming with Early Stop (first 3 pages only)');
    log.info('='.repeat(60));
    log.info('');

    let count = 0;

    for await (const page of client.market.streamMarketOrders(
      FORGE_REGION_ID,
    )) {
      count += page.data.length;
      log.info(
        `  Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
      );

      if (page.page >= 3) {
        log.info('  → Stopping early (backpressure demo)');
        break;
      }
    }

    log.info('');
    log.info(
      `Processed ${count.toLocaleString()} orders from 3 pages ` +
        `without fetching the remaining pages`,
    );
  } finally {
    client.shutdown();
  }
}

async function streamMarketTypes() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-streaming-demo',
  });

  try {
    log.info('');
    log.info('='.repeat(60));
    log.info('Streaming Market Type IDs — The Forge');
    log.info('='.repeat(60));
    log.info('');

    let totalTypes = 0;

    for await (const page of client.market.streamMarketTypes(FORGE_REGION_ID)) {
      totalTypes += page.data.length;
      log.info(
        `  Page ${page.page}/${page.totalPages}: ` +
          `${page.data.length} type IDs`,
      );
    }

    log.info('');
    log.info(
      `Total item types with active orders: ${totalTypes.toLocaleString()}`,
    );
  } finally {
    client.shutdown();
  }
}

async function main() {
  try {
    await streamWithEarlyStop();
    await streamMarketTypes();
    await streamAllOrders();
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  }
}

main();
