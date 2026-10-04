/**
 * ESI.ts Example: Asset Inventory
 *
 * Demonstrates character asset management: listing items, looking up
 * locations and names in bulk via POST, and summarizing inventory.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-assets.read_assets.v1  (character asset list, locations, and names)
 *
 * Usage: npm run example:assets
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

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-assets-demo',
  });

  try {
    log.info('Asset Inventory\n');

    // Step 1: Fetch all character assets
    // Scope: esi-assets.read_assets.v1
    log.info('Fetching character assets...');
    const assets = await client.assets.getCharacterAssets(CHARACTER_ID);
    log.info(`  Found ${assets.length} items\n`);

    // Step 2: Summarize by location
    const byLocation = new Map<string, { count: number; items: number }>();
    for (const asset of assets) {
      const locKey = asset.location_id.toString();
      const entry = byLocation.get(locKey) || { count: 0, items: 0 };
      entry.count += 1;
      entry.items += asset.quantity;
      byLocation.set(locKey, entry);
    }

    log.info(`Assets by Location (${byLocation.size} locations)`);
    log.info('-'.repeat(40));
    const sortedLocations = [...byLocation.entries()]
      .sort((a, b) => b[1].items - a[1].items)
      .slice(0, 10);
    for (const [locId, info] of sortedLocations) {
      log.info(
        `  Location ${locId}: ${info.count} stacks, ${info.items.toLocaleString()} total items`,
      );
    }
    if (byLocation.size > 10) {
      log.info(`  ... and ${byLocation.size - 10} more locations`);
    }

    // Step 3: Summarize by location_flag (hangar, cargo, etc.)
    const byFlag = new Map<string, number>();
    for (const asset of assets) {
      byFlag.set(
        asset.location_flag,
        (byFlag.get(asset.location_flag) || 0) + 1,
      );
    }

    log.info(`\nAssets by Container Type`);
    log.info('-'.repeat(40));
    const sortedFlags = [...byFlag.entries()].sort((a, b) => b[1] - a[1]);
    for (const [flag, count] of sortedFlags) {
      log.info(`  ${flag}: ${count} stacks`);
    }

    // Step 4: Look up names for named items (ships, containers, etc.)
    // Scope: esi-assets.read_assets.v1
    const sampleIds = assets.slice(0, 10).map((a) => a.item_id);
    if (sampleIds.length > 0) {
      log.info('\nAsset Names (first 10 items)');
      log.info('-'.repeat(40));
      try {
        const names = await client.assets.postCharacterAssetNames(
          CHARACTER_ID,
          sampleIds,
        );
        for (const named of names) {
          const displayName = named.name || '(unnamed)';
          log.info(`  Item ${named.item_id}: ${displayName}`);
        }
      } catch {
        log.info('  Name lookup unavailable for these items');
      }
    }

    // Summary statistics
    const totalItems = assets.reduce((sum, a) => sum + a.quantity, 0);
    const uniqueTypes = new Set(assets.map((a) => a.type_id));
    log.info('\nInventory Summary');
    log.info('-'.repeat(40));
    log.info(`  Total stacks:     ${assets.length.toLocaleString()}`);
    log.info(`  Total items:      ${totalItems.toLocaleString()}`);
    log.info(`  Unique types:     ${uniqueTypes.size.toLocaleString()}`);
    log.info(`  Locations:        ${byLocation.size}`);
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-assets.read_assets.v1',
      );
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
