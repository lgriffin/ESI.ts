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
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const SAMPLE_NAMES = [
  'Chribba',
  'Jita',
  'Tritanium',
  'Goonswarm Federation',
  'CCP Games',
];
const SAMPLE_CHARACTER_IDS = [90404873, 90439768, 1689391488];

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Universe POST Helpers & Character Affiliation\n');

    // --- Bulk Names → IDs ---
    log.info('Bulk Names → IDs (POST /universe/ids)');
    log.info('-'.repeat(50));
    log.info(`  Looking up: ${SAMPLE_NAMES.join(', ')}`);
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
        log.info(`  ${cat}:`);
        for (const item of items) {
          log.info(`    ${item.name} → ${item.id}`);
        }
      }
    }

    // --- IDs → Names & Categories ---
    log.info('\nIDs → Names & Categories (POST /universe/names)');
    log.info('-'.repeat(50));
    const allIds: number[] = [];
    for (const cat of categories) {
      const items = idResult[cat];
      if (items) {
        for (const item of items) {
          if (item.id !== undefined) allIds.push(item.id);
        }
      }
    }
    log.info(`  Resolving ${allIds.length} IDs...`);
    const nameResults = await client.universe.postNamesAndCategories(allIds);
    for (const entry of nameResults) {
      log.info(`    ${entry.id}: ${entry.name} (${entry.category})`);
    }

    // --- Character Affiliation ---
    log.info('\nCharacter Affiliation (POST /characters/affiliation)');
    log.info('-'.repeat(50));
    log.info(`  Looking up ${SAMPLE_CHARACTER_IDS.length} characters...`);
    const affiliations =
      await client.characters.postCharacterAffiliation(SAMPLE_CHARACTER_IDS);
    for (const aff of affiliations) {
      const parts = [`char ${aff.character_id}`, `corp ${aff.corporation_id}`];
      if (aff.alliance_id) parts.push(`alliance ${aff.alliance_id}`);
      if (aff.faction_id) parts.push(`faction ${aff.faction_id}`);
      log.info(`    ${parts.join(' | ')}`);
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
