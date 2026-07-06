/**
 * ESI.ts Example: Loyalty Points & Planetary Interaction
 *
 * Demonstrates loyalty point balances, LP store offers, planetary
 * colonies, colony layouts, customs offices, and PI schematics.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:loyalty-pi
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;
const CONCORD_CORP_ID = 1000125;
const SAMPLE_SCHEMATIC_ID = 65;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Loyalty Points & Planetary Interaction\n');

    // --- Loyalty Points ---
    console.log('Loyalty Points');
    console.log('-'.repeat(50));
    const lpBalances = await client.loyalty.getLoyaltyPoints(CHARACTER_ID);
    console.log(`  LP balances with ${lpBalances.length} corporation(s)`);
    for (const lp of lpBalances.slice(0, 10)) {
      console.log(`    Corp ${lp.corporation_id}: ${lp.loyalty_points?.toLocaleString() ?? 0} LP`);
    }
    if (lpBalances.length > 10) console.log(`    ... and ${lpBalances.length - 10} more`);

    // --- LP Store (public) ---
    console.log('\nLP Store Offers (CONCORD)');
    console.log('-'.repeat(50));
    const offers = await client.loyalty.getLoyaltyStoreOffers(CONCORD_CORP_ID);
    console.log(`  Total offers: ${offers.length}`);
    for (const offer of offers.slice(0, 5)) {
      console.log(`    Offer ${offer.offer_id}: type ${offer.type_id}, ${offer.lp_cost} LP + ${offer.isk_cost?.toLocaleString() ?? 0} ISK`);
    }
    if (offers.length > 5) console.log(`    ... and ${offers.length - 5} more`);

    // --- PI Colonies ---
    console.log('\nPlanetary Colonies');
    console.log('-'.repeat(50));
    const colonies = await client.pi.getColonies(CHARACTER_ID);
    console.log(`  Active colonies: ${colonies.length}`);
    for (const colony of colonies) {
      console.log(`    Planet ${colony.planet_id}: ${colony.planet_type} (upgraded ${colony.upgrade_level}, pins: ${colony.num_pins})`);

      try {
        const layout = await client.pi.getColonyLayout(CHARACTER_ID, colony.planet_id);
        const pinCount = layout.pins?.length ?? 0;
        const linkCount = layout.links?.length ?? 0;
        const routeCount = layout.routes?.length ?? 0;
        console.log(`      Layout: ${pinCount} pins, ${linkCount} links, ${routeCount} routes`);
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          console.log('      Layout not available');
        } else {
          throw err;
        }
      }
    }
    if (colonies.length === 0) console.log('  No active PI colonies');

    // --- Customs Offices (corp, may 403) ---
    console.log('\nCorporation Customs Offices');
    console.log('-'.repeat(50));
    try {
      const pocos = await client.pi.getCorporationCustomsOffices(CORP_ID);
      console.log(`  Customs offices: ${pocos.length}`);
    } catch (err) {
      if (err instanceof EsiError && (err.statusCode === 403 || err.statusCode === 401)) {
        console.log('  Requires corporation roles — skipped');
      } else {
        throw err;
      }
    }

    // --- PI Schematic (public) ---
    console.log('\nPI Schematic');
    console.log('-'.repeat(50));
    const schematic = await client.pi.getSchematicInformation(SAMPLE_SCHEMATIC_ID);
    console.log(`  Schematic ${SAMPLE_SCHEMATIC_ID}: ${schematic.schematic_name}`);
    console.log(`  Cycle time: ${schematic.cycle_time}s`);

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
