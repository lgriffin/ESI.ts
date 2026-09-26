/**
 * ESI.ts Example: Market Prices
 *
 * Fetches average market prices and price history for a specific item.
 * Uses the Forge region (Jita's region) for history data.
 *
 * Usage: npm run example:market
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';

const FORGE_REGION_ID = 10000002;
const TRITANIUM_TYPE_ID = 34;
const PLEX_TYPE_ID = 44992;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Market Data\n');

    // Fetch global average prices and Tritanium history in parallel
    const [prices, tritHistory] = await Promise.all([
      client.market.getMarketPrices(),
      client.market.getMarketHistory(FORGE_REGION_ID, TRITANIUM_TYPE_ID),
    ]);

    // Show a few notable item prices
    const notableItems = [
      { id: TRITANIUM_TYPE_ID, name: 'Tritanium' },
      { id: PLEX_TYPE_ID, name: 'PLEX' },
      { id: 11399, name: 'Raven (Battleship)' },
      { id: 587, name: 'Rifter (Frigate)' },
    ];

    console.log('Average Prices (Universe-wide)');
    console.log('-'.repeat(50));
    for (const item of notableItems) {
      const price = prices.find((p: any) => p.type_id === item.id);
      if (price) {
        const avg =
          price.average_price?.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          }) ?? 'N/A';
        const adj =
          price.adjusted_price?.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          }) ?? 'N/A';
        console.log(
          `  ${item.name.padEnd(22)} avg: ${avg.padStart(18)}  adj: ${adj.padStart(18)}`,
        );
      }
    }

    // Show recent Tritanium history in The Forge
    console.log('\nTritanium Price History (The Forge, last 5 days)');
    console.log('-'.repeat(70));
    console.log(
      '  Date          Average       Lowest       Highest      Volume',
    );
    const recent = tritHistory.slice(-5);
    for (const day of recent) {
      const date = day.date;
      const avg = day.average.toFixed(2).padStart(12);
      const low = day.lowest.toFixed(2).padStart(12);
      const high = day.highest.toFixed(2).padStart(12);
      const vol = day.volume.toLocaleString().padStart(14);
      console.log(`  ${date} ${avg} ${low} ${high} ${vol}`);
    }

    console.log(`\nTotal items with price data: ${prices.length}`);

    // Market groups: the browser tree in the in-game market window
    const groupIds = await client.market.getMarketGroups();
    const firstGroupId = groupIds[0];
    console.log(`\nMarket groups: ${groupIds.length}`);
    if (firstGroupId !== undefined) {
      const group = await client.market.getMarketGroupInformation(firstGroupId);
      console.log(`  ${group.name}: ${group.types.length} type(s)`);
    }

    // Everything traded in a small region, and its live orders (all pages)
    const PURE_BLIND_REGION_ID = 10000023;
    const [tradedTypes, orders] = await Promise.all([
      client.market.fetchAllMarketTypes(PURE_BLIND_REGION_ID),
      client.market.fetchAllMarketOrders(PURE_BLIND_REGION_ID),
    ]);
    const buys = orders.filter((o) => o.is_buy_order).length;
    console.log(
      `Pure Blind: ${tradedTypes.length} types traded, ${orders.length} orders (${buys} buy, ${orders.length - buys} sell)`,
    );
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
