/**
 * ESI.ts Example: Paragon Hub SKINR Marketplace
 *
 * Browses the Paragon Hub marketplace for SKINR ship customization designs.
 * The public listings endpoint requires no authentication; character, alliance,
 * and corporation targeted listings require the esi.cosmetic.char:read scope.
 *
 * Usage: npm run example:paragon-hub
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Paragon Hub SKINR Marketplace\n');

    // --- Public listings (no auth required) ---
    console.log('Public SKINR Listings (first page)');
    console.log('-'.repeat(60));

    const publicPage = await client.paragonHub.getPublicListings(
      undefined,
      undefined,
      10,
    );

    for (const listing of publicPage.listings) {
      const priceStr = listing.price.isk
        ? `${(listing.price.isk / 1_000_000).toFixed(1)}M ISK`
        : `${listing.price.plex} PLEX`;
      console.log(
        `  [${listing.state}] SKINR ${listing.skinr_id} — ${priceStr} — ` +
          `Qty: ${listing.quantity} — Seller: ${listing.seller_id}`,
      );
    }

    if (publicPage.listings.length === 0) {
      console.log('  No public listings found.');
    }

    // --- Cursor pagination ---
    if (publicPage.cursor?.after) {
      console.log('\nFetching next page...');
      const nextPage = await client.paragonHub.getPublicListings(
        publicPage.cursor.after,
        undefined,
        10,
      );
      console.log(`  Page 2: ${nextPage.listings.length} listing(s)`);
    }

    // --- Character-specific listings (requires auth) ---
    const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);
    if (characterId) {
      console.log(`\nYour Paragon Hub Listings (Character ${characterId})`);
      console.log('-'.repeat(60));

      const charPage = await client.paragonHub.getCharacterListings(
        characterId,
      );

      const byState = new Map<string, number>();
      for (const listing of charPage.listings) {
        byState.set(listing.state, (byState.get(listing.state) || 0) + 1);
      }
      for (const [state, count] of byState) {
        console.log(`  ${state.padEnd(12)} ${count}`);
      }

      if (charPage.listings.length === 0) {
        console.log('  No listings found for this character.');
      }
    } else {
      console.log(
        '\nSkipping character listings (set CHARACTER_ID env var to include).',
      );
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
