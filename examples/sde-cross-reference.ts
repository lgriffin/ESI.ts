/**
 * ESI.ts Example: SDE + ESI Cross-Reference
 *
 * Demonstrates using SDE static data alongside live ESI API calls
 * to enrich API responses with readable entity names and metadata.
 *
 * Usage: npm run example:sde-cross-ref
 */
import { EsiClient } from '../src/EsiClient';
import { SdeLocalEngine, isSdeDatabaseError } from '../src/sde';

async function main() {
  const esi = new EsiClient();

  let sde: SdeLocalEngine;
  try {
    sde = new SdeLocalEngine({
      databasePath: process.env.SDE_DATABASE_PATH || './eve-sde.sqlite',
    });
  } catch (err) {
    if (isSdeDatabaseError(err)) {
      console.error(
        'SDE database not found. Set SDE_DATABASE_PATH or place eve-sde.sqlite in the project root.',
      );
      console.error('This example requires a pre-built SDE SQLite database.');
      process.exit(1);
    }
    throw err;
  }

  try {
    const TRITANIUM_TYPE_ID = 34;
    const THE_FORGE_REGION_ID = 10000002;

    // Enrich IDs with SDE context
    const typeInfo = sde.getType(TRITANIUM_TYPE_ID);
    const regionInfo = sde.getRegion(THE_FORGE_REGION_ID);

    console.log('=== Cross-Reference: ESI + SDE ===\n');
    console.log(`Item: ${typeInfo?.name ?? `type_id ${TRITANIUM_TYPE_ID}`}`);
    console.log(`Region: ${regionInfo?.name ?? `region_id ${THE_FORGE_REGION_ID}`}`);

    if (typeInfo) {
      console.log(`  Volume per unit: ${typeInfo.volume}`);
      console.log(`  Portion size: ${typeInfo.portionSize}`);
      const group = sde.getGroup(typeInfo.groupId);
      const category = group ? sde.getCategory(group.categoryId) : null;
      console.log(`  Classification: ${category?.name} > ${group?.name}`);
    }

    // Fetch live data from ESI
    console.log('\nFetching live market data from ESI...');
    try {
      const orders = await esi.market.getRegionOrders(
        THE_FORGE_REGION_ID,
        TRITANIUM_TYPE_ID,
      );

      if (Array.isArray(orders) && orders.length > 0) {
        const buyOrders = orders.filter((o) => o.is_buy_order);
        const sellOrders = orders.filter((o) => !o.is_buy_order);

        console.log(`\nActive orders for ${typeInfo?.name ?? 'Unknown'}:`);
        console.log(`  Buy orders: ${buyOrders.length}`);
        console.log(`  Sell orders: ${sellOrders.length}`);

        if (sellOrders.length > 0) {
          const lowestSell = Math.min(...sellOrders.map((o) => o.price));
          console.log(`  Lowest sell: ${lowestSell.toFixed(2)} ISK`);
        }
        if (buyOrders.length > 0) {
          const highestBuy = Math.max(...buyOrders.map((o) => o.price));
          console.log(`  Highest buy: ${highestBuy.toFixed(2)} ISK`);
        }
      } else {
        console.log('  No orders found');
      }
    } catch (err) {
      console.log(
        `  (ESI request failed: ${err instanceof Error ? err.message : 'unknown error'})`,
      );
    }

    // SDE version
    const version = sde.getVersion();
    console.log(`\nSDE: v${version.version} (${version.buildDate})`);
  } finally {
    sde.close();
    esi.shutdown();
  }
}

main().catch(console.error);
