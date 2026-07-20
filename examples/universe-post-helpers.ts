/**
 * ESI.ts Example: Universe POST Helpers & Character Affiliation
 *
 * Demonstrates the three safe read-only POST endpoints:
 *  - postBulkNamesToIds (resolve names → IDs)
 *  - postNamesAndCategories (resolve IDs → names + categories)
 *  - postCharacterAffiliation (bulk character corp/alliance lookup)
 *
 * NO AUTHENTICATION REQUIRED — all three endpoints are public.
 *
 * Usage: npm run example:universe-posts
 */
import { EsiClient } from '../src/EsiClient';

const SAMPLE_NAMES = [
  'Chribba',
  'Jita',
  'Tritanium',
  'Goonswarm Federation',
  'CCP Games',
];
const SAMPLE_CHARACTER_IDS = [90404873, 90439768, 1689391488];

async function main() {
  const client = new EsiClient();

  try {
    console.log('Universe POST Helpers & Character Affiliation\n');

    // --- Bulk Names → IDs ---
    console.log('Bulk Names → IDs (POST /universe/ids)');
    console.log('-'.repeat(50));
    console.log(`  Looking up: ${SAMPLE_NAMES.join(', ')}`);
    const idResult = await client.universe.postBulkNamesToIds(SAMPLE_NAMES);

    const categories = [
      'characters',
      'systems',
      'inventory_types',
      'alliances',
      'corporations',
      'agents',
      'constellations',
      'factions',
      'regions',
      'stations',
    ] as const;
    for (const cat of categories) {
      const items = idResult[cat];
      if (items && items.length > 0) {
        console.log(`  ${cat}:`);
        for (const item of items) {
          console.log(`    ${item.name} → ${item.id}`);
        }
      }
    }

    // --- IDs → Names & Categories ---
    console.log('\nIDs → Names & Categories (POST /universe/names)');
    console.log('-'.repeat(50));
    const allIds: number[] = [];
    for (const cat of categories) {
      const items = idResult[cat];
      if (items) {
        for (const item of items) {
          allIds.push(item.id);
        }
      }
    }
    console.log(`  Resolving ${allIds.length} IDs...`);
    const nameResults = await client.universe.postNamesAndCategories(allIds);
    for (const entry of nameResults) {
      console.log(`    ${entry.id}: ${entry.name} (${entry.category})`);
    }

    // --- Character Affiliation ---
    console.log('\nCharacter Affiliation (POST /characters/affiliation)');
    console.log('-'.repeat(50));
    console.log(`  Looking up ${SAMPLE_CHARACTER_IDS.length} characters...`);
    const affiliations =
      await client.characters.postCharacterAffiliation(SAMPLE_CHARACTER_IDS);
    for (const aff of affiliations) {
      const parts = [`char ${aff.character_id}`, `corp ${aff.corporation_id}`];
      if (aff.alliance_id) parts.push(`alliance ${aff.alliance_id}`);
      if (aff.faction_id) parts.push(`faction ${aff.faction_id}`);
      console.log(`    ${parts.join(' | ')}`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
