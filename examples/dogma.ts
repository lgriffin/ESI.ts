/**
 * ESI.ts Example: Dogma & Item Types
 *
 * Explores EVE's game mechanics data: item types, dogma attributes, and effects.
 *
 * Usage: npm run example:dogma
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const RIFTER_TYPE_ID = 587;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Dogma & Item Type Data\n');

    // Look up Rifter details and some dogma attributes
    const [rifter, attrIds] = await Promise.all([
      client.universe.getTypeById(RIFTER_TYPE_ID),
      client.dogma.getAttributes(),
    ]);

    log.info(`Item: ${rifter.name}`);
    log.info('-'.repeat(40));
    log.info(`  Type ID:     ${rifter.type_id}`);
    log.info(`  Group ID:    ${rifter.group_id}`);
    log.info(`  Description: ${rifter.description?.substring(0, 80)}...`);
    log.info(`  Mass:        ${rifter.mass?.toLocaleString()} kg`);
    log.info(`  Volume:      ${rifter.volume?.toLocaleString()} m3`);
    log.info(`  Capacity:    ${rifter.capacity?.toLocaleString()} m3`);
    log.info(`  Published:   ${rifter.published}`);

    if (rifter.dogma_attributes?.length) {
      log.info(
        `\nDogma Attributes on Rifter (first 5 of ${rifter.dogma_attributes.length})`,
      );
      log.info('-'.repeat(40));

      // Look up the first 5 attribute names
      const sampleAttrs = rifter.dogma_attributes.slice(0, 5);
      const attrDetails = await Promise.all(
        sampleAttrs.map((a: any) =>
          client.dogma.getAttributeById(a.attribute_id),
        ),
      );

      for (let i = 0; i < sampleAttrs.length; i++) {
        const attr = attrDetails[i]!;
        const sample = sampleAttrs[i]!;
        const name =
          attr.display_name || attr.name || `attr_${sample.attribute_id}`;
        log.info(`  ${name}: ${sample.value}`);
      }
    }

    log.info(`\nTotal dogma attributes in game: ${attrIds.length}`);
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
