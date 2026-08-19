/**
 * ESI.ts Example: Blueprint & Industry Data
 *
 * Looks up a blueprint and displays its manufacturing requirements,
 * resolving material type IDs to names via the SDE.
 *
 * Setup: npx ts-node scripts/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-industry.ts
 */
import { SdeDataProvider } from '../src/sde';

function main() {
  const sde = SdeDataProvider.fromDirectory(process.env.SDE_DATA_PATH || './sde-data');

  try {
    // Rifter Blueprint
    const RIFTER_BP_ID = 587;
    const bp = sde.getBlueprint(RIFTER_BP_ID);

    if (!bp) {
      console.error(`Blueprint ${RIFTER_BP_ID} not found`);
      return;
    }

    const bpType = sde.getType(bp.blueprintTypeId);
    console.log(`=== ${bpType?.name ?? `Blueprint ${bp.blueprintTypeId}`} ===`);
    console.log(`  Max production limit: ${bp.maxProductionLimit}`);

    const mfg = bp.activities.manufacturing;
    if (mfg) {
      console.log(`\n--- Manufacturing ---`);
      console.log(`  Time: ${mfg.time}s (${(mfg.time / 60).toFixed(1)} min)`);

      if (mfg.materials) {
        console.log('  Materials:');
        for (const mat of mfg.materials) {
          const matType = sde.getType(mat.typeId);
          console.log(`    ${matType?.name ?? `type ${mat.typeId}`}: ${mat.quantity}`);
        }
      }

      if (mfg.products) {
        console.log('  Products:');
        for (const prod of mfg.products) {
          const prodType = sde.getType(prod.typeId);
          console.log(`    ${prodType?.name ?? `type ${prod.typeId}`}: x${prod.quantity}`);
        }
      }
    }

    const research = bp.activities.research_material;
    if (research) {
      console.log(`\n--- Material Research ---`);
      console.log(`  Time: ${research.time}s (${(research.time / 60).toFixed(1)} min)`);
    }

    const invention = bp.activities.invention;
    if (invention) {
      console.log(`\n--- Invention ---`);
      console.log(`  Time: ${invention.time}s`);
      if (invention.products) {
        for (const prod of invention.products) {
          const prodType = sde.getType(prod.typeId);
          console.log(`  Produces: ${prodType?.name ?? `type ${prod.typeId}`}`);
        }
      }
    }

    // Planet schematics
    console.log('\n\n=== Planet Schematics (sample) ===');
    const schematics = sde.getAllPlanetSchematics().slice(0, 5);
    for (const s of schematics) {
      console.log(`  ${s.name} (cycle: ${s.cycleTime}s)`);
    }
  } finally {
    sde.close();
  }
}

main();
