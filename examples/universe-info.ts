/**
 * ESI.ts Example: Universe Information
 *
 * Fetches solar system, station, and constellation details.
 * Demonstrates navigating the universe data hierarchy.
 *
 * Usage: npm run example:universe
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const JITA_SYSTEM_ID = 30000142;
const JITA_TRADE_HUB_STATION_ID = 60003760;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Universe Data Lookup\n');

    const [system, station] = await Promise.all([
      client.universe.getSystemById(JITA_SYSTEM_ID),
      client.universe.getStationById(JITA_TRADE_HUB_STATION_ID),
    ]);

    log.info('Solar System: Jita');
    log.info('-'.repeat(40));
    log.info(`  System ID:        ${system.system_id}`);
    log.info(`  Name:             ${system.name}`);
    log.info(`  Security Status:  ${system.security_status?.toFixed(4)}`);
    log.info(`  Constellation ID: ${system.constellation_id}`);
    log.info(`  Planets:          ${system.planets?.length ?? 0}`);
    log.info(`  Stargates:        ${system.stargates?.length ?? 0}`);
    log.info(`  Stations:         ${system.stations?.length ?? 0}`);

    // Look up the constellation
    const constellation = await client.universe.getConstellationById(
      system.constellation_id,
    );

    log.info(`\nConstellation: ${constellation.name}`);
    log.info('-'.repeat(40));
    log.info(`  Constellation ID: ${constellation.constellation_id}`);
    log.info(`  Region ID:        ${constellation.region_id}`);
    log.info(`  Systems:          ${constellation.systems?.length ?? 0}`);

    // Look up the region
    const region = await client.universe.getRegionById(constellation.region_id);

    log.info(`\nRegion: ${region.name}`);
    log.info('-'.repeat(40));
    log.info(`  Region ID:        ${region.region_id}`);
    log.info(`  Constellations:   ${region.constellations?.length ?? 0}`);

    log.info(`\nStation: ${station.name}`);
    log.info('-'.repeat(40));
    log.info(`  Station ID:       ${station.station_id}`);
    log.info(`  Owner (Corp ID):  ${station.owner}`);
    log.info(`  Type ID:          ${station.type_id}`);

    const structureIds = await client.universe.getStructures();
    log.info(`\nPublic Upwell structures: ${structureIds.length}`);
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
