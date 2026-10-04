/**
 * ESI.ts Example: Market Orders & Groups
 *
 * Demonstrates character market orders, order history, corporation
 * orders, market groups, and structure market orders.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:market-orders
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

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

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
      log.info(`  ${label}: requires corporation roles — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Market Orders & Groups\n');

    // --- Character Orders ---
    log.info('Character Orders');
    log.info('-'.repeat(50));
    const [orders, history] = await Promise.all([
      client.market.getCharacterOrders(CHARACTER_ID),
      client.market.getCharacterOrderHistory(CHARACTER_ID),
    ]);
    log.info(`  Active orders: ${orders.length}`);
    for (const order of orders.slice(0, 5)) {
      const side = order.is_buy_order ? 'BUY' : 'SELL';
      log.info(
        `    ${side} ${order.volume_remain}/${order.volume_total} x type ${order.type_id} @ ${order.price.toLocaleString()} ISK`,
      );
    }
    if (orders.length > 5) log.info(`    ... and ${orders.length - 5} more`);

    log.info(`\n  Order history: ${history.length} orders`);
    for (const order of history.slice(0, 3)) {
      const side = order.is_buy_order ? 'BUY' : 'SELL';
      log.info(
        `    ${side} type ${order.type_id} @ ${order.price.toLocaleString()} ISK (${order.state || 'completed'})`,
      );
    }
    if (history.length > 3) log.info(`    ... and ${history.length - 3} more`);

    // --- Corporation Orders (may 403) ---
    log.info('\nCorporation Orders');
    log.info('-'.repeat(50));
    await tryOrSkip('Corp orders', async () => {
      const corpOrders = await client.market.getCorporationOrders(CORP_ID);
      log.info(`  Active corp orders: ${corpOrders.length}`);
    });
    await tryOrSkip('Corp order history', async () => {
      const corpHistory =
        await client.market.getCorporationOrderHistory(CORP_ID);
      log.info(`  Corp order history: ${corpHistory.length}`);
    });

    // --- Market Groups (public) ---
    log.info('\nMarket Groups');
    log.info('-'.repeat(50));
    const groupIds = await client.market.getMarketGroups();
    log.info(`  Total market groups: ${groupIds.length}`);

    const sampleGroup = await client.market.getMarketGroupInformation(
      groupIds[0]!,
    );
    log.info(
      `\n  Sample group: ${sampleGroup.name} (ID: ${sampleGroup.market_group_id})`,
    );
    log.info(
      `    Description: ${sampleGroup.description?.substring(0, 100) ?? ''}...`,
    );
    log.info(`    Types: ${sampleGroup.types?.length ?? 0}`);
    if (sampleGroup.parent_group_id) {
      log.info(`    Parent group: ${sampleGroup.parent_group_id}`);
    }

    // --- Structure Market Orders (needs structure access, will likely 403) ---
    log.info('\nStructure Market Orders');
    log.info('-'.repeat(50));
    try {
      const structures = await client.universe.getStructures();
      if (structures.length > 0) {
        const structOrders = await client.market.getMarketOrdersInStructure(
          structures[0]!,
        );
        log.info(`  Structure ${structures[0]}: ${structOrders.length} orders`);
      } else {
        log.info('  No public structures available');
      }
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 403 || err.statusCode === 401)
      ) {
        log.info('  Requires structure access — skipped');
      } else {
        throw err;
      }
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
