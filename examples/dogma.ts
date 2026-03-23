/**
 * ESI.ts Example: Dogma & Item Types
 *
 * Explores EVE's game mechanics data: item types, dogma attributes, and effects.
 *
 * Usage: npm run example:dogma
 */
import { EsiClient } from '../src/EsiClient';

const RIFTER_TYPE_ID = 587;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Dogma & Item Type Data\n');

    // Look up Rifter details and some dogma attributes
    const [rifter, attrIds] = await Promise.all([
      client.universe.getTypeById(RIFTER_TYPE_ID),
      client.dogma.getAttributes(),
    ]);

    console.log(`Item: ${rifter.name}`);
    console.log('-'.repeat(40));
    console.log(`  Type ID:     ${rifter.type_id}`);
    console.log(`  Group ID:    ${rifter.group_id}`);
    console.log(`  Description: ${rifter.description?.substring(0, 80)}...`);
    console.log(`  Mass:        ${rifter.mass?.toLocaleString()} kg`);
    console.log(`  Volume:      ${rifter.volume?.toLocaleString()} m3`);
    console.log(`  Capacity:    ${rifter.capacity?.toLocaleString()} m3`);
    console.log(`  Published:   ${rifter.published}`);

    if (rifter.dogma_attributes?.length) {
      console.log(`\nDogma Attributes on Rifter (first 5 of ${rifter.dogma_attributes.length})`);
      console.log('-'.repeat(40));

      // Look up the first 5 attribute names
      const sampleAttrs = rifter.dogma_attributes.slice(0, 5);
      const attrDetails = await Promise.all(
        sampleAttrs.map((a: any) => client.dogma.getAttributeById(a.attribute_id))
      );

      for (let i = 0; i < sampleAttrs.length; i++) {
        const name = attrDetails[i].display_name || attrDetails[i].name || `attr_${sampleAttrs[i].attribute_id}`;
        console.log(`  ${name}: ${sampleAttrs[i].value}`);
      }
    }

    console.log(`\nTotal dogma attributes in game: ${attrIds.length}`);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
