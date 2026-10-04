/**
 * ESI.ts Example: Blueprint & Industry Data
 *
 * Looks up a blueprint and displays its manufacturing requirements,
 * resolving material type IDs to names via the SDE.
 *
 * Setup: npx ts-node scripts/sde/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-industry.ts
 *
 * @nightly sde
 */
import { SdeDataProvider, type Blueprint } from '../src/sde';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

function main() {
  const sde = SdeDataProvider.fromDirectory(
    process.env.SDE_DATA_PATH || './sde-data',
  );

  try {
    // Find the blueprint by what it builds rather than by a hard-coded
    // blueprint type ID: the export keys blueprints by their own type ID,
    // which the SDE can renumber, and the second nightly against the real
    // export found neither 587 (the Rifter) nor 787 (its usual blueprint).
    const RIFTER_ID = 587;
    const blueprints = sde.getAllEntities<Blueprint>('eve_blueprints');
    const bp =
      blueprints.find((b) =>
        b.activities.manufacturing?.products?.some(
          (p) => p.typeId === RIFTER_ID,
        ),
      ) ?? blueprints.find((b) => b.activities.manufacturing !== undefined);

    if (!bp) {
      log.error('No blueprint with a manufacturing activity found');
      return;
    }

    const bpType = sde.getType(bp.blueprintTypeId);
    log.info(`=== ${bpType?.name ?? `Blueprint ${bp.blueprintTypeId}`} ===`);
    log.info(`  Max production limit: ${bp.maxProductionLimit}`);

    const mfg = bp.activities.manufacturing;
    if (mfg) {
      log.info(`\n--- Manufacturing ---`);
      log.info(`  Time: ${mfg.time}s (${(mfg.time / 60).toFixed(1)} min)`);

      if (mfg.materials) {
        log.info('  Materials:');
        for (const mat of mfg.materials) {
          const matType = sde.getType(mat.typeId);
          log.info(
            `    ${matType?.name ?? `type ${mat.typeId}`}: ${mat.quantity}`,
          );
        }
      }

      if (mfg.products) {
        log.info('  Products:');
        for (const prod of mfg.products) {
          const prodType = sde.getType(prod.typeId);
          log.info(
            `    ${prodType?.name ?? `type ${prod.typeId}`}: x${prod.quantity}`,
          );
        }
      }
    }

    const research = bp.activities.research_material;
    if (research) {
      log.info(`\n--- Material Research ---`);
      log.info(
        `  Time: ${research.time}s (${(research.time / 60).toFixed(1)} min)`,
      );
    }

    const invention = bp.activities.invention;
    if (invention) {
      log.info(`\n--- Invention ---`);
      log.info(`  Time: ${invention.time}s`);
      if (invention.products) {
        for (const prod of invention.products) {
          const prodType = sde.getType(prod.typeId);
          log.info(`  Produces: ${prodType?.name ?? `type ${prod.typeId}`}`);
        }
      }
    }

    // Planet schematics
    log.info('\n\n=== Planet Schematics (sample) ===');
    const schematics = sde.getAllPlanetSchematics().slice(0, 5);
    for (const s of schematics) {
      log.info(`  ${s.name} (cycle: ${s.cycleTime}s)`);
    }
  } finally {
    sde.close();
  }
}

main();
