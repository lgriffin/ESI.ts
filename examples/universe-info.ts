/**
 * ESI.ts Example: Universe Information
 *
 * Fetches solar system, station, and constellation details.
 * Demonstrates navigating the universe data hierarchy.
 *
 * Usage: npm run example:universe
 */
import { EsiClient } from '../src/EsiClient';

const JITA_SYSTEM_ID = 30000142;
const JITA_TRADE_HUB_STATION_ID = 60003760;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Universe Data Lookup\n');

    const [system, station] = await Promise.all([
      client.universe.getSystemById(JITA_SYSTEM_ID),
      client.universe.getStationById(JITA_TRADE_HUB_STATION_ID),
    ]);

    console.log('Solar System: Jita');
    console.log('-'.repeat(40));
    console.log(`  System ID:        ${system.system_id}`);
    console.log(`  Name:             ${system.name}`);
    console.log(`  Security Status:  ${system.security_status?.toFixed(4)}`);
    console.log(`  Constellation ID: ${system.constellation_id}`);
    console.log(`  Planets:          ${system.planets?.length ?? 0}`);
    console.log(`  Stargates:        ${system.stargates?.length ?? 0}`);
    console.log(`  Stations:         ${system.stations?.length ?? 0}`);

    // Look up the constellation
    const constellation = await client.universe.getConstellationById(system.constellation_id);

    console.log(`\nConstellation: ${constellation.name}`);
    console.log('-'.repeat(40));
    console.log(`  Constellation ID: ${constellation.constellation_id}`);
    console.log(`  Region ID:        ${constellation.region_id}`);
    console.log(`  Systems:          ${constellation.systems?.length ?? 0}`);

    // Look up the region
    const region = await client.universe.getRegionById(constellation.region_id);

    console.log(`\nRegion: ${region.name}`);
    console.log('-'.repeat(40));
    console.log(`  Region ID:        ${region.region_id}`);
    console.log(`  Constellations:   ${region.constellations?.length ?? 0}`);

    console.log(`\nStation: ${station.name}`);
    console.log('-'.repeat(40));
    console.log(`  Station ID:       ${station.station_id}`);
    console.log(`  Owner (Corp ID):  ${station.owner}`);
    console.log(`  Type ID:          ${station.type_id}`);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
