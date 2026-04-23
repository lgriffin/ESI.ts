/**
 * ESI.ts Example: Fittings & Clones
 *
 * Demonstrates ship fitting management and clone state inspection.
 * Shows saved fittings, clone jump availability, and active implants.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-fittings.read_fittings.v1   (read saved fittings)
 *   - esi-fittings.write_fittings.v1  (create/delete fittings — shown but not executed)
 *   - esi-clones.read_clones.v1       (clone state + jump clones)
 *   - esi-clones.read_implants.v1     (active implants)
 *
 * Usage: npm run example:fittings
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-fittings-demo' });

  try {
    console.log('Fittings & Clones\n');

    // Fetch fittings, clones, and implants in parallel
    // Scopes: esi-fittings.read_fittings.v1, esi-clones.read_clones.v1, esi-clones.read_implants.v1
    console.log('Fetching data...\n');
    const [fittings, clones, implants] = await Promise.all([
      client.fittings.getFittings(CHARACTER_ID),
      client.clones.getClones(CHARACTER_ID),
      client.clones.getImplants(CHARACTER_ID),
    ]);

    // --- Fittings ---
    console.log(`Saved Fittings (${fittings.length})`);
    console.log('='.repeat(50));
    if (fittings.length === 0) {
      console.log('  No saved fittings');
    } else {
      // Group by ship type
      const byShip = new Map<number, typeof fittings>();
      for (const fit of fittings) {
        const existing = byShip.get(fit.ship_type_id) || [];
        existing.push(fit);
        byShip.set(fit.ship_type_id, existing);
      }

      for (const [shipTypeId, fits] of byShip) {
        console.log(`\n  Ship Type ${shipTypeId} (${fits.length} fitting${fits.length > 1 ? 's' : ''}):`);
        for (const fit of fits) {
          console.log(`    "${fit.name}" (ID: ${fit.fitting_id})`);
          if (fit.items && fit.items.length > 0) {
            console.log(`      ${fit.items.length} modules/charges`);
            for (const item of fit.items.slice(0, 3)) {
              console.log(`        Type ${item.type_id} in ${item.flag}`);
            }
            if (fit.items.length > 3) {
              console.log(`        ... and ${fit.items.length - 3} more`);
            }
          }
        }
      }
    }

    // Write operations available:
    // client.fittings.createFitting(characterId, { name, ship_type_id, items }) — Scope: esi-fittings.write_fittings.v1
    // client.fittings.deleteFitting(characterId, fittingId)                     — Scope: esi-fittings.write_fittings.v1

    // --- Clones ---
    console.log(`\n\nClone State`);
    console.log('='.repeat(50));

    // Home location
    if (clones.home_location) {
      const loc = clones.home_location;
      console.log(`  Home station:  ${loc.location_type} ${loc.location_id}`);
    }

    // Jump clones
    if (clones.jump_clones && clones.jump_clones.length > 0) {
      console.log(`\n  Jump Clones (${clones.jump_clones.length}):`);
      for (const jc of clones.jump_clones) {
        const implantCount = jc.implants?.length || 0;
        console.log(`    Clone ${jc.jump_clone_id} @ ${jc.location_type} ${jc.location_id} (${implantCount} implants)`);
        if (jc.implants && jc.implants.length > 0) {
          for (const imp of jc.implants.slice(0, 3)) {
            console.log(`      Implant type ${imp}`);
          }
          if (jc.implants.length > 3) {
            console.log(`      ... and ${jc.implants.length - 3} more`);
          }
        }
      }
    } else {
      console.log('  No jump clones available');
    }

    // Active implants
    console.log(`\n  Active Implants (${implants.length}):`);
    if (implants.length === 0) {
      console.log('    No implants installed');
    } else {
      for (const typeId of implants) {
        console.log(`    Type ${typeId}`);
      }
    }

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scopes:');
      console.error('  - esi-fittings.read_fittings.v1');
      console.error('  - esi-clones.read_clones.v1');
      console.error('  - esi-clones.read_implants.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
