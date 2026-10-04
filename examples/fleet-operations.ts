/**
 * ESI.ts Example: Fleet Operations
 *
 * Demonstrates fleet management: checking a character's current fleet,
 * fetching fleet details, listing members, and inspecting wing/squad structure.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-fleets.read_fleet.v1   (read fleet info, members, wings)
 *   - esi-fleets.write_fleet.v1  (create wings/squads, invite members — shown but not executed)
 *
 * Usage: npm run example:fleet
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
    clientId: 'esi-ts-fleet-demo',
  });

  try {
    log.info('Fleet Operations\n');

    // Step 1: Check if the character is in a fleet
    // Scope: esi-fleets.read_fleet.v1
    log.info('Checking fleet membership...');
    let fleetInfo;
    try {
      fleetInfo = await client.fleets.getCharacterFleetInfo(CHARACTER_ID);
    } catch (err) {
      if (err instanceof EsiError && err.statusCode === 404) {
        log.info('Character is not currently in a fleet.\n');
        log.info(
          'To see fleet operations in action, join a fleet in-game and re-run this example.',
        );
        return;
      }
      throw err;
    }

    log.info('Fleet Membership');
    log.info('-'.repeat(40));
    log.info(`  Fleet ID: ${fleetInfo.fleet_id}`);
    log.info(`  Role:     ${fleetInfo.role}`);
    log.info(`  Wing:     ${fleetInfo.wing_id}`);
    log.info(`  Squad:    ${fleetInfo.squad_id}`);

    // Step 2: Fetch fleet details, members, and wings in parallel
    // Scope: esi-fleets.read_fleet.v1
    log.info('\nFetching fleet details...');
    const [fleet, members, wings] = await Promise.all([
      client.fleets.getFleetInformation(fleetInfo.fleet_id),
      client.fleets.getFleetMembers(fleetInfo.fleet_id),
      client.fleets.getFleetWings(fleetInfo.fleet_id),
    ]);

    // Fleet overview
    log.info('\nFleet Details');
    log.info('-'.repeat(40));
    log.info(`  MOTD:       ${fleet.motd || '(none)'}`);
    log.info(`  Free move:  ${fleet.is_free_move ? 'yes' : 'no'}`);

    // Members
    log.info(`\nFleet Members (${members.length})`);
    log.info('-'.repeat(40));
    for (const member of members.slice(0, 10)) {
      const role = member.role.padEnd(12);
      log.info(
        `  ${role} | Character ${member.character_id} | Ship type ${member.ship_type_id} | System ${member.solar_system_id}`,
      );
    }
    if (members.length > 10) {
      log.info(`  ... and ${members.length - 10} more members`);
    }

    // Ship composition
    const shipTypes = new Map<number, number>();
    for (const m of members) {
      shipTypes.set(m.ship_type_id, (shipTypes.get(m.ship_type_id) || 0) + 1);
    }
    log.info('\nShip Composition');
    log.info('-'.repeat(40));
    for (const [typeId, count] of [...shipTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)) {
      log.info(`  Type ${typeId}: ${count} pilot${count > 1 ? 's' : ''}`);
    }

    // Wing/squad structure
    log.info(`\nFleet Structure (${wings.length} wings)`);
    log.info('-'.repeat(40));
    for (const wing of wings) {
      const squadCount = wing.squads?.length || 0;
      log.info(`  Wing ${wing.id} "${wing.name}" (${squadCount} squads)`);
      if (wing.squads) {
        for (const squad of wing.squads) {
          log.info(`    Squad ${squad.id} "${squad.name}"`);
        }
      }
    }

    // Write operations are available but not demonstrated to avoid side effects:
    // client.fleets.updateFleet(fleetId, { motd: 'New MOTD' })       — Scope: esi-fleets.write_fleet.v1
    // client.fleets.createFleetWing(fleetId, {})                     — Scope: esi-fleets.write_fleet.v1
    // client.fleets.createFleetInvitation(fleetId, { character_id }) — Scope: esi-fleets.write_fleet.v1
    log.info(
      '\nNote: write operations (updateFleet, createFleetWing, createFleetInvitation) require scope esi-fleets.write_fleet.v1',
    );
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-fleets.read_fleet.v1',
      );
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
