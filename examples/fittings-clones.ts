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
    clientId: 'esi-ts-fittings-demo',
  });

  try {
    log.info('Fittings & Clones\n');

    // Fetch fittings, clones, and implants in parallel
    // Scopes: esi-fittings.read_fittings.v1, esi-clones.read_clones.v1, esi-clones.read_implants.v1
    log.info('Fetching data...\n');
    const [fittings, clones, implants] = await Promise.all([
      client.fittings.getFittings(CHARACTER_ID),
      client.clones.getClones(CHARACTER_ID),
      client.clones.getImplants(CHARACTER_ID),
    ]);

    // --- Fittings ---
    log.info(`Saved Fittings (${fittings.length})`);
    log.info('='.repeat(50));
    if (fittings.length === 0) {
      log.info('  No saved fittings');
    } else {
      // Group by ship type
      const byShip = new Map<number, typeof fittings>();
      for (const fit of fittings) {
        const existing = byShip.get(fit.ship_type_id) || [];
        existing.push(fit);
        byShip.set(fit.ship_type_id, existing);
      }

      for (const [shipTypeId, fits] of byShip) {
        log.info(
          `\n  Ship Type ${shipTypeId} (${fits.length} fitting${fits.length > 1 ? 's' : ''}):`,
        );
        for (const fit of fits) {
          log.info(`    "${fit.name}" (ID: ${fit.fitting_id})`);
          if (fit.items && fit.items.length > 0) {
            log.info(`      ${fit.items.length} modules/charges`);
            for (const item of fit.items.slice(0, 3)) {
              log.info(`        Type ${item.type_id} in ${item.flag}`);
            }
            if (fit.items.length > 3) {
              log.info(`        ... and ${fit.items.length - 3} more`);
            }
          }
        }
      }
    }

    // Write operations available:
    // client.fittings.createFitting(characterId, { name, ship_type_id, items }) — Scope: esi-fittings.write_fittings.v1
    // client.fittings.deleteFitting(characterId, fittingId)                     — Scope: esi-fittings.write_fittings.v1

    // --- Clones ---
    log.info(`\n\nClone State`);
    log.info('='.repeat(50));

    // Home location
    if (clones.home_location) {
      const loc = clones.home_location;
      log.info(`  Home station:  ${loc.location_type} ${loc.location_id}`);
    }

    // Jump clones
    if (clones.jump_clones && clones.jump_clones.length > 0) {
      log.info(`\n  Jump Clones (${clones.jump_clones.length}):`);
      for (const jc of clones.jump_clones) {
        const implantCount = jc.implants?.length || 0;
        log.info(
          `    Clone ${jc.jump_clone_id} @ ${jc.location_type} ${jc.location_id} (${implantCount} implants)`,
        );
        if (jc.implants && jc.implants.length > 0) {
          for (const imp of jc.implants.slice(0, 3)) {
            log.info(`      Implant type ${imp}`);
          }
          if (jc.implants.length > 3) {
            log.info(`      ... and ${jc.implants.length - 3} more`);
          }
        }
      }
    } else {
      log.info('  No jump clones available');
    }

    // Active implants
    log.info(`\n  Active Implants (${implants.length}):`);
    if (implants.length === 0) {
      log.info('    No implants installed');
    } else {
      for (const typeId of implants) {
        log.info(`    Type ${typeId}`);
      }
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error('Authentication required. Set ESI_ACCESS_TOKEN with scopes:');
      log.error('  - esi-fittings.read_fittings.v1');
      log.error('  - esi-clones.read_clones.v1');
      log.error('  - esi-clones.read_implants.v1');
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
