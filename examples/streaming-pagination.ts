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
 */
import { EsiClient } from '../src/EsiClient';

const FORGE_REGION_ID = 10000002;

async function streamAllOrders() {
  const client = new EsiClient({ clientId: 'esi-ts-streaming-demo' });

  try {
    console.log('='.repeat(60));
    console.log('Streaming Market Orders — The Forge (all pages)');
    console.log('='.repeat(60));
    console.log();

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

      console.log(
        `  Page ${page.page}/${page.totalPages}: ` +
          `${page.data.length} orders ` +
          `(total so far: ${totalOrders.toLocaleString()})`,
      );
    }

    const elapsed = Date.now() - startTime;
    console.log();
    console.log(`Done in ${(elapsed / 1000).toFixed(1)}s`);
    console.log(`  Total orders: ${totalOrders.toLocaleString()}`);
    console.log(`  Buy orders:   ${buyOrders.toLocaleString()}`);
    console.log(`  Sell orders:  ${sellOrders.toLocaleString()}`);
  } finally {
    client.shutdown();
  }
}

async function streamWithEarlyStop() {
  const client = new EsiClient({ clientId: 'esi-ts-streaming-demo' });

  try {
    console.log();
    console.log('='.repeat(60));
    console.log('Streaming with Early Stop (first 3 pages only)');
    console.log('='.repeat(60));
    console.log();

    let count = 0;

    for await (const page of client.market.streamMarketOrders(
      FORGE_REGION_ID,
    )) {
      count += page.data.length;
      console.log(
        `  Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
      );

      if (page.page >= 3) {
        console.log('  → Stopping early (backpressure demo)');
        break;
      }
    }

    console.log();
    console.log(
      `Processed ${count.toLocaleString()} orders from 3 pages ` +
        `without fetching the remaining pages`,
    );
  } finally {
    client.shutdown();
  }
}

async function streamMarketTypes() {
  const client = new EsiClient({ clientId: 'esi-ts-streaming-demo' });

  try {
    console.log();
    console.log('='.repeat(60));
    console.log('Streaming Market Type IDs — The Forge');
    console.log('='.repeat(60));
    console.log();

    let totalTypes = 0;

    for await (const page of client.market.streamMarketTypes(FORGE_REGION_ID)) {
      totalTypes += page.data.length;
      console.log(
        `  Page ${page.page}/${page.totalPages}: ` +
          `${page.data.length} type IDs`,
      );
    }

    console.log();
    console.log(
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
    console.error('\nError:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
