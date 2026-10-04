/**
 * ESI.ts Example: Paragon Hub SKINR Marketplace
 *
 * Browses the Paragon Hub marketplace for SKINR ship customization designs.
 * The public listings endpoint requires no authentication; character, alliance,
 * and corporation targeted listings require the esi.cosmetic.char:read scope.
 *
 * Usage: npm run example:paragon-hub
 *
 * @nightly mixed
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Paragon Hub SKINR Marketplace\n');

    // --- Public listings (no auth required) ---
    log.info('Public SKINR Listings (first page)');
    log.info('-'.repeat(60));

    const publicPage = await client.paragonHub.getPublicListings(
      undefined,
      undefined,
      10,
    );

    for (const listing of publicPage.listings) {
      const priceStr = listing.price.isk
        ? `${(listing.price.isk / 1_000_000).toFixed(1)}M ISK`
        : `${listing.price.plex} PLEX`;
      log.info(
        `  [${listing.state}] SKINR ${listing.skinr_id} — ${priceStr} — ` +
          `Qty: ${listing.quantity} — Seller: ${listing.seller_id}`,
      );
    }

    if (publicPage.listings.length === 0) {
      log.info('  No public listings found.');
    }

    // --- The design behind a listing (public, cosmetics client) ---
    const firstListing = publicPage.listings[0];
    if (firstListing) {
      const design = await client.cosmetics.getSkinr(firstListing.skinr_id);
      log.info(
        `\n  SKINR ${firstListing.skinr_id}: "${design.name}" for ship type ` +
          `${design.ship_type_id}, tier ${design.tier.level}`,
      );
    }

    // --- Cursor pagination ---
    if (publicPage.cursor?.after) {
      log.info('\nFetching next page...');
      const nextPage = await client.paragonHub.getPublicListings(
        publicPage.cursor.after,
        undefined,
        10,
      );
      log.info(`  Page 2: ${nextPage.listings.length} listing(s)`);
    }

    // --- Character-specific listings (requires auth) ---
    const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);
    if (characterId) {
      log.info(`\nYour Paragon Hub Listings (Character ${characterId})`);
      log.info('-'.repeat(60));

      const charPage =
        await client.paragonHub.getCharacterListings(characterId);

      const byState = new Map<string, number>();
      for (const listing of charPage.listings) {
        byState.set(listing.state, (byState.get(listing.state) || 0) + 1);
      }
      for (const [state, count] of byState) {
        log.info(`  ${state.padEnd(12)} ${count}`);
      }

      if (charPage.listings.length === 0) {
        log.info('  No listings found for this character.');
      }
    } else {
      log.info(
        '\nSkipping character listings (set CHARACTER_ID env var to include).',
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
