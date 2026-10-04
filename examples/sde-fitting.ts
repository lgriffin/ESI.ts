/**
 * ESI.ts Example: Ship Fitting with Dogma Attributes
 *
 * Looks up a ship type and its dogma attributes to display fitting-relevant
 * stats like powergrid, CPU, slot layout, and capacitor.
 *
 * Setup: npx ts-node scripts/sde/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-fitting.ts
 *
 * @nightly sde
 */
import { SdeDataProvider } from '../src/sde';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const FITTING_ATTRIBUTES: Record<string, string> = {
  powerOutput: 'Powergrid',
  cpuOutput: 'CPU',
  hiSlots: 'High Slots',
  medSlots: 'Mid Slots',
  lowSlots: 'Low Slots',
  capacitorCapacity: 'Capacitor',
  shieldCapacity: 'Shield HP',
  armorHP: 'Armor HP',
  hp: 'Structure HP',
  maxVelocity: 'Max Velocity',
  agility: 'Agility',
  warpSpeedMultiplier: 'Warp Speed',
  droneBandwidth: 'Drone Bandwidth',
  droneCapacity: 'Drone Bay',
};

function main() {
  const sde = SdeDataProvider.fromDirectory(
    process.env.SDE_DATA_PATH || './sde-data',
  );

  try {
    const RIFTER_TYPE_ID = 587;
    const ship = sde.getType(RIFTER_TYPE_ID);
    if (!ship) {
      log.error(`Type ${RIFTER_TYPE_ID} not found`);
      return;
    }

    const group = sde.getGroup(ship.groupId);
    const category = group ? sde.getCategory(group.categoryId) : null;

    log.info(`=== ${ship.name} ===`);
    log.info(`  ${category?.name} > ${group?.name}`);
    log.info(`  Mass: ${ship.mass} kg`);
    log.info(`  Volume: ${ship.volume} m3`);

    // Look up dogma attributes for this type
    const typeDogma = sde.getTypeDogma(RIFTER_TYPE_ID);
    if (typeDogma && Array.isArray(typeDogma.dogmaAttributes)) {
      log.info('\n--- Fitting Stats ---');

      for (const attr of typeDogma.dogmaAttributes) {
        const attrDef = sde.getDogmaAttribute(
          (attr as { attributeId: number }).attributeId,
        );
        if (attrDef && attrDef.name in FITTING_ATTRIBUTES) {
          const label = FITTING_ATTRIBUTES[attrDef.name];
          const unit = sde.getDogmaUnit(attrDef.unitId ?? 0);
          const unitStr = unit?.displayName ? ` ${unit.displayName}` : '';
          log.info(
            `  ${label}: ${(attr as { value: number }).value}${unitStr}`,
          );
        }
      }
    } else {
      log.info('\n  (No dogma attributes found for this type)');
    }

    // Show other ships in the same group
    if (group) {
      const siblings = sde
        .getTypesByGroup(group.groupId)
        .filter((t) => t.published && t.typeId !== ship.typeId);
      if (siblings.length > 0) {
        log.info(`\n--- Other ${group.name} ---`);
        for (const s of siblings.slice(0, 10)) {
          log.info(`  - ${s.name} (${s.typeId})`);
        }
        if (siblings.length > 10) {
          log.info(`  ... and ${siblings.length - 10} more`);
        }
      }
    }
  } finally {
    sde.close();
  }
}

main();
