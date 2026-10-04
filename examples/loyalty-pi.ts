/**
 * ESI.ts Example: Loyalty Points & Planetary Interaction
 *
 * Demonstrates loyalty point balances, LP store offers, planetary
 * colonies, colony layouts, customs offices, and PI schematics.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:loyalty-pi
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
const CONCORD_CORP_ID = 1000125;
const SAMPLE_SCHEMATIC_ID = 65;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Loyalty Points & Planetary Interaction\n');

    // --- Loyalty Points ---
    log.info('Loyalty Points');
    log.info('-'.repeat(50));
    const lpBalances = await client.loyalty.getLoyaltyPoints(CHARACTER_ID);
    log.info(`  LP balances with ${lpBalances.length} corporation(s)`);
    for (const lp of lpBalances.slice(0, 10)) {
      log.info(
        `    Corp ${lp.corporation_id}: ${lp.loyalty_points?.toLocaleString() ?? 0} LP`,
      );
    }
    if (lpBalances.length > 10)
      log.info(`    ... and ${lpBalances.length - 10} more`);

    // --- LP Store (public) ---
    log.info('\nLP Store Offers (CONCORD)');
    log.info('-'.repeat(50));
    const offers = await client.loyalty.getLoyaltyStoreOffers(CONCORD_CORP_ID);
    log.info(`  Total offers: ${offers.length}`);
    for (const offer of offers.slice(0, 5)) {
      log.info(
        `    Offer ${offer.offer_id}: type ${offer.type_id}, ${offer.lp_cost} LP + ${offer.isk_cost?.toLocaleString() ?? 0} ISK`,
      );
    }
    if (offers.length > 5) log.info(`    ... and ${offers.length - 5} more`);

    // --- PI Colonies ---
    log.info('\nPlanetary Colonies');
    log.info('-'.repeat(50));
    const colonies = await client.pi.getColonies(CHARACTER_ID);
    log.info(`  Active colonies: ${colonies.length}`);
    for (const colony of colonies) {
      log.info(
        `    Planet ${colony.planet_id}: ${colony.planet_type} (upgraded ${colony.upgrade_level}, pins: ${colony.num_pins})`,
      );

      try {
        const layout = await client.pi.getColonyLayout(
          CHARACTER_ID,
          colony.planet_id,
        );
        const pinCount = layout.pins?.length ?? 0;
        const linkCount = layout.links?.length ?? 0;
        const routeCount = layout.routes?.length ?? 0;
        log.info(
          `      Layout: ${pinCount} pins, ${linkCount} links, ${routeCount} routes`,
        );
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          log.info('      Layout not available');
        } else {
          throw err;
        }
      }
    }
    if (colonies.length === 0) log.info('  No active PI colonies');

    // --- Customs Offices (corp, may 403) ---
    log.info('\nCorporation Customs Offices');
    log.info('-'.repeat(50));
    try {
      const pocos = await client.pi.getCorporationCustomsOffices(CORP_ID);
      log.info(`  Customs offices: ${pocos.length}`);
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 403 || err.statusCode === 401)
      ) {
        log.info('  Requires corporation roles — skipped');
      } else {
        throw err;
      }
    }

    // --- PI Schematic (public) ---
    log.info('\nPI Schematic');
    log.info('-'.repeat(50));
    const schematic =
      await client.pi.getSchematicInformation(SAMPLE_SCHEMATIC_ID);
    log.info(`  Schematic ${SAMPLE_SCHEMATIC_ID}: ${schematic.schematic_name}`);
    log.info(`  Cycle time: ${schematic.cycle_time}s`);
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
