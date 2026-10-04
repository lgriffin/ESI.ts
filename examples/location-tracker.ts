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

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-location-demo',
  });

  try {
    log.info('Character Location Tracker\n');

    // Fetch location, online status, and ship in parallel
    // Scopes: esi-location.read_location.v1, esi-location.read_online.v1, esi-location.read_ship_type.v1
    log.info('Fetching location data...\n');
    const [location, online, ship] = await Promise.all([
      client.location.getCharacterLocation(CHARACTER_ID),
      client.location.getCharacterOnline(CHARACTER_ID),
      client.location.getCharacterShip(CHARACTER_ID),
    ]);

    // Online status
    log.info('Online Status');
    log.info('-'.repeat(40));
    log.info(`  Online:       ${online.online ? 'YES' : 'NO'}`);
    if (online.last_login) {
      log.info(
        `  Last login:   ${new Date(online.last_login).toLocaleString()}`,
      );
    }
    if (online.last_logout) {
      log.info(
        `  Last logout:  ${new Date(online.last_logout).toLocaleString()}`,
      );
    }
    if (online.logins) {
      log.info(`  Total logins: ${online.logins.toLocaleString()}`);
    }

    // Current location — resolve system name from public endpoint
    log.info('\nCurrent Location');
    log.info('-'.repeat(40));
    log.info(`  Solar system ID: ${location.solar_system_id}`);

    try {
      const system = await client.universe.getSystemById(
        location.solar_system_id,
      );
      log.info(`  System name:     ${system.name}`);
      log.info(`  Security:        ${system.security_status?.toFixed(2)}`);

      if (system.constellation_id) {
        const constellation = await client.universe.getConstellationById(
          system.constellation_id,
        );
        log.info(`  Constellation:   ${constellation.name}`);
        if (constellation.region_id) {
          const region = await client.universe.getRegionById(
            constellation.region_id,
          );
          log.info(`  Region:          ${region.name}`);
        }
      }
    } catch {
      log.info('  (could not resolve system details)');
    }

    if (location.station_id) {
      log.info(`  Station ID:      ${location.station_id}`);
      try {
        const station = await client.universe.getStationById(
          location.station_id,
        );
        log.info(`  Station name:    ${station.name}`);
      } catch {
        log.info('  (could not resolve station name)');
      }
    } else if (location.structure_id) {
      log.info(`  Structure ID:    ${location.structure_id}`);
    } else {
      log.info('  Docked:          No (in space)');
    }

    // Current ship
    log.info('\nCurrent Ship');
    log.info('-'.repeat(40));
    log.info(`  Ship name:    ${ship.ship_name}`);
    log.info(`  Ship type ID: ${ship.ship_type_id}`);
    log.info(`  Ship item ID: ${ship.ship_item_id}`);

    try {
      const shipType = await client.universe.getTypeById(ship.ship_type_id);
      log.info(`  Ship type:    ${shipType.name}`);
      if (shipType.group_id) {
        log.info(`  Group ID:     ${shipType.group_id}`);
      }
    } catch {
      log.info('  (could not resolve ship type name)');
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with the following scopes:',
      );
      log.error('  - esi-location.read_location.v1');
      log.error('  - esi-location.read_online.v1');
      log.error('  - esi-location.read_ship_type.v1');
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
