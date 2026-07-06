/**
 * ESI.ts Example: Market Orders & Groups
 *
 * Demonstrates character market orders, order history, corporation
 * orders, market groups, and structure market orders.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:market-orders
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

async function tryOrSkip(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 403 || err.statusCode === 401)) {
      console.log(`  ${label}: requires corporation roles — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Market Orders & Groups\n');

    // --- Character Orders ---
    console.log('Character Orders');
    console.log('-'.repeat(50));
    const [orders, history] = await Promise.all([
      client.market.getCharacterOrders(CHARACTER_ID),
      client.market.getCharacterOrderHistory(CHARACTER_ID),
    ]);
    console.log(`  Active orders: ${orders.length}`);
    for (const order of orders.slice(0, 5)) {
      const side = order.is_buy_order ? 'BUY' : 'SELL';
      console.log(`    ${side} ${order.volume_remain}/${order.volume_total} x type ${order.type_id} @ ${order.price.toLocaleString()} ISK`);
    }
    if (orders.length > 5) console.log(`    ... and ${orders.length - 5} more`);

    console.log(`\n  Order history: ${history.length} orders`);
    for (const order of history.slice(0, 3)) {
      const side = order.is_buy_order ? 'BUY' : 'SELL';
      console.log(`    ${side} type ${order.type_id} @ ${order.price.toLocaleString()} ISK (${order.state || 'completed'})`);
    }
    if (history.length > 3) console.log(`    ... and ${history.length - 3} more`);

    // --- Corporation Orders (may 403) ---
    console.log('\nCorporation Orders');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp orders', async () => {
      const corpOrders = await client.market.getCorporationOrders(CORP_ID);
      console.log(`  Active corp orders: ${corpOrders.length}`);
    });
    await tryOrSkip('Corp order history', async () => {
      const corpHistory = await client.market.getCorporationOrderHistory(CORP_ID);
      console.log(`  Corp order history: ${corpHistory.length}`);
    });

    // --- Market Groups (public) ---
    console.log('\nMarket Groups');
    console.log('-'.repeat(50));
    const groupIds = await client.market.getMarketGroups();
    console.log(`  Total market groups: ${groupIds.length}`);

    const sampleGroup = await client.market.getMarketGroupInformation(groupIds[0]!);
    console.log(`\n  Sample group: ${sampleGroup.name} (ID: ${sampleGroup.market_group_id})`);
    console.log(`    Description: ${sampleGroup.description?.substring(0, 100) ?? ''}...`);
    console.log(`    Types: ${sampleGroup.types?.length ?? 0}`);
    if (sampleGroup.parent_group_id) {
      console.log(`    Parent group: ${sampleGroup.parent_group_id}`);
    }

    // --- Structure Market Orders (needs structure access, will likely 403) ---
    console.log('\nStructure Market Orders');
    console.log('-'.repeat(50));
    try {
      const structures = await client.universe.getStructures();
      if (structures.length > 0) {
        const structOrders = await client.market.getMarketOrdersInStructure(structures[0]!);
        console.log(`  Structure ${structures[0]}: ${structOrders.length} orders`);
      } else {
        console.log('  No public structures available');
      }
    } catch (err) {
      if (err instanceof EsiError && (err.statusCode === 403 || err.statusCode === 401)) {
        console.log('  Requires structure access — skipped');
      } else {
        throw err;
      }
    }

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
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
