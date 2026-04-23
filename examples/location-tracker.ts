/**
 * ESI.ts Example: Location Tracker
 *
 * Demonstrates real-time character location tracking: current system,
 * online status, and current ship. Also resolves system/station names
 * from the public universe endpoints.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-location.read_location.v1      (current solar system, station, structure)
 *   - esi-location.read_online.v1        (online status, last login/logout times)
 *   - esi-location.read_ship_type.v1     (current ship type and name)
 *
 * Usage: npm run example:location
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-location-demo' });

  try {
    console.log('Character Location Tracker\n');

    // Fetch location, online status, and ship in parallel
    // Scopes: esi-location.read_location.v1, esi-location.read_online.v1, esi-location.read_ship_type.v1
    console.log('Fetching location data...\n');
    const [location, online, ship] = await Promise.all([
      client.location.getCharacterLocation(CHARACTER_ID),
      client.location.getCharacterOnline(CHARACTER_ID),
      client.location.getCharacterShip(CHARACTER_ID),
    ]);

    // Online status
    console.log('Online Status');
    console.log('-'.repeat(40));
    console.log(`  Online:       ${online.online ? 'YES' : 'NO'}`);
    if (online.last_login) {
      console.log(`  Last login:   ${new Date(online.last_login).toLocaleString()}`);
    }
    if (online.last_logout) {
      console.log(`  Last logout:  ${new Date(online.last_logout).toLocaleString()}`);
    }
    if (online.logins) {
      console.log(`  Total logins: ${online.logins.toLocaleString()}`);
    }

    // Current location — resolve system name from public endpoint
    console.log('\nCurrent Location');
    console.log('-'.repeat(40));
    console.log(`  Solar system ID: ${location.solar_system_id}`);

    try {
      const system = await client.universe.getSystemById(location.solar_system_id);
      console.log(`  System name:     ${system.name}`);
      console.log(`  Security:        ${system.security_status?.toFixed(2)}`);

      if (system.constellation_id) {
        const constellation = await client.universe.getConstellationById(system.constellation_id);
        console.log(`  Constellation:   ${constellation.name}`);
        if (constellation.region_id) {
          const region = await client.universe.getRegionById(constellation.region_id);
          console.log(`  Region:          ${region.name}`);
        }
      }
    } catch {
      console.log('  (could not resolve system details)');
    }

    if (location.station_id) {
      console.log(`  Station ID:      ${location.station_id}`);
      try {
        const station = await client.universe.getStationById(location.station_id);
        console.log(`  Station name:    ${station.name}`);
      } catch {
        console.log('  (could not resolve station name)');
      }
    } else if (location.structure_id) {
      console.log(`  Structure ID:    ${location.structure_id}`);
    } else {
      console.log('  Docked:          No (in space)');
    }

    // Current ship
    console.log('\nCurrent Ship');
    console.log('-'.repeat(40));
    console.log(`  Ship name:    ${ship.ship_name}`);
    console.log(`  Ship type ID: ${ship.ship_type_id}`);
    console.log(`  Ship item ID: ${ship.ship_item_id}`);

    try {
      const shipType = await client.universe.getTypeById(ship.ship_type_id);
      console.log(`  Ship type:    ${shipType.name}`);
      if (shipType.group_id) {
        console.log(`  Group ID:     ${shipType.group_id}`);
      }
    } catch {
      console.log('  (could not resolve ship type name)');
    }

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with the following scopes:');
      console.error('  - esi-location.read_location.v1');
      console.error('  - esi-location.read_online.v1');
      console.error('  - esi-location.read_ship_type.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
