/**
 * ESI.ts Example: Mercenary Dens & Tactical Operations
 *
 * Fetches mercenary dens across New Eden and their spawned
 * tactical operations (MTOs), showing development and anarchy levels.
 *
 * Note: These endpoints require authentication and may return 404 if CCP
 * has not yet deployed mercenary content to the current server version.
 *
 * Usage: npm run example:mercenary
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  // Character ID to query mercenary data for
  const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);
  if (!characterId) {
    log.error('Set CHARACTER_ID environment variable to your character ID.');
    process.exit(1);
  }

  try {
    log.info('Mercenary Dens & Tactical Operations\n');

    let dens: Awaited<ReturnType<typeof client.mercenary.getMercenaryDens>>;
    let operations: Awaited<
      ReturnType<typeof client.mercenary.getMercenaryTacticalOperations>
    >;

    try {
      [dens, operations] = await Promise.all([
        client.mercenary.getMercenaryDens(characterId),
        client.mercenary.getMercenaryTacticalOperations(characterId),
      ]);
    } catch (err) {
      if (isNotFound(err)) {
        log.info(
          'Mercenary endpoints are not currently available on this ESI version.',
        );
        log.info(
          'These endpoints may be deployed in a future EVE Online patch.',
        );
        return;
      }
      throw err;
    }

    const denList = dens.mercenary_dens;
    const operationList = operations.operations;

    log.info(`Mercenary Dens (${denList.length} total)`);
    log.info('-'.repeat(60));
    for (const den of denList.slice(0, 10)) {
      const running = operationList.filter(
        (op) => op.mercenary_den_id === den.id,
      ).length;
      log.info(
        `  Den ${den.id} — Planet ${den.planet_id} — ${running} operation(s)`,
      );
    }
    if (denList.length > 10) log.info(`  ... and ${denList.length - 10} more`);

    log.info(`\nTactical Operations (${operationList.length} total)`);
    log.info('-'.repeat(60));
    for (const op of operationList.slice(0, 5)) {
      log.info(`  Operation ${op.id} → Den ${op.mercenary_den_id}`);
    }

    // Fetch detail for the first den
    const firstDens = denList[0];
    if (firstDens) {
      log.info('\nMercenary Den Detail');
      log.info('-'.repeat(60));
      const denDetail = await client.mercenary.getMercenaryDenDetail(
        characterId,
        firstDens.id,
      );
      log.info(`  Den ${denDetail.id} — State: ${denDetail.state}`);
      log.info(
        `  Skyhook: Planet ${denDetail.skyhook.planet_id} (Corp ${denDetail.skyhook.corporation_id})`,
      );
      log.info(`  Infomorphs: ${denDetail.infomorphs.amount}`);
      log.info(
        `  Evolution: Dev ${denDetail.evolution.development.level} ` +
          `(${denDetail.evolution.development.amount}) / ` +
          `Anarchy ${denDetail.evolution.anarchy.level} ` +
          `(${denDetail.evolution.anarchy.amount})`,
      );
    }

    // Fetch detail for the first operation
    const firstOperations = operationList[0];
    if (firstOperations) {
      log.info('\nMTO Detail');
      log.info('-'.repeat(60));
      const opDetail =
        await client.mercenary.getMercenaryTacticalOperationDetail(
          characterId,
          firstOperations.id,
        );
      log.info(`  Operation ${opDetail.id} — State: ${opDetail.state}`);
      log.info(`  Dungeon Type: ${opDetail.dungeon_type_id}`);
      log.info(`  Expires: ${opDetail.expires}`);
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
