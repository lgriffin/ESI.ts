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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-fleet-demo' });

  try {
    console.log('Fleet Operations\n');

    // Step 1: Check if the character is in a fleet
    // Scope: esi-fleets.read_fleet.v1
    console.log('Checking fleet membership...');
    let fleetInfo;
    try {
      fleetInfo = await client.fleets.getCharacterFleetInfo(CHARACTER_ID);
    } catch (err) {
      if (err instanceof EsiError && err.statusCode === 404) {
        console.log('Character is not currently in a fleet.\n');
        console.log('To see fleet operations in action, join a fleet in-game and re-run this example.');
        return;
      }
      throw err;
    }

    console.log('Fleet Membership');
    console.log('-'.repeat(40));
    console.log(`  Fleet ID: ${fleetInfo.fleet_id}`);
    console.log(`  Role:     ${fleetInfo.role}`);
    console.log(`  Wing:     ${fleetInfo.wing_id}`);
    console.log(`  Squad:    ${fleetInfo.squad_id}`);

    // Step 2: Fetch fleet details, members, and wings in parallel
    // Scope: esi-fleets.read_fleet.v1
    console.log('\nFetching fleet details...');
    const [fleet, members, wings] = await Promise.all([
      client.fleets.getFleetInformation(fleetInfo.fleet_id),
      client.fleets.getFleetMembers(fleetInfo.fleet_id),
      client.fleets.getFleetWings(fleetInfo.fleet_id),
    ]);

    // Fleet overview
    console.log('\nFleet Details');
    console.log('-'.repeat(40));
    console.log(`  MOTD:       ${fleet.motd || '(none)'}`);
    console.log(`  Free move:  ${fleet.is_free_move ? 'yes' : 'no'}`);

    // Members
    console.log(`\nFleet Members (${members.length})`);
    console.log('-'.repeat(40));
    for (const member of members.slice(0, 10)) {
      const role = member.role.padEnd(12);
      console.log(`  ${role} | Character ${member.character_id} | Ship type ${member.ship_type_id} | System ${member.solar_system_id}`);
    }
    if (members.length > 10) {
      console.log(`  ... and ${members.length - 10} more members`);
    }

    // Ship composition
    const shipTypes = new Map<number, number>();
    for (const m of members) {
      shipTypes.set(m.ship_type_id, (shipTypes.get(m.ship_type_id) || 0) + 1);
    }
    console.log('\nShip Composition');
    console.log('-'.repeat(40));
    for (const [typeId, count] of [...shipTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  Type ${typeId}: ${count} pilot${count > 1 ? 's' : ''}`);
    }

    // Wing/squad structure
    console.log(`\nFleet Structure (${wings.length} wings)`);
    console.log('-'.repeat(40));
    for (const wing of wings) {
      const squadCount = wing.squads?.length || 0;
      console.log(`  Wing ${wing.id} "${wing.name}" (${squadCount} squads)`);
      if (wing.squads) {
        for (const squad of wing.squads) {
          console.log(`    Squad ${squad.id} "${squad.name}"`);
        }
      }
    }

    // Write operations are available but not demonstrated to avoid side effects:
    // client.fleets.updateFleet(fleetId, { motd: 'New MOTD' })       — Scope: esi-fleets.write_fleet.v1
    // client.fleets.createFleetWing(fleetId, {})                     — Scope: esi-fleets.write_fleet.v1
    // client.fleets.createFleetInvitation(fleetId, { character_id }) — Scope: esi-fleets.write_fleet.v1
    console.log('\nNote: write operations (updateFleet, createFleetWing, createFleetInvitation) require scope esi-fleets.write_fleet.v1');

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-fleets.read_fleet.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
