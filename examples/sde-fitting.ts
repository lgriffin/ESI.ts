/**
 * ESI.ts Example: Ship Fitting with Dogma Attributes
 *
 * Looks up a ship type and its dogma attributes to display fitting-relevant
 * stats like powergrid, CPU, slot layout, and capacitor.
 *
 * Setup: npx ts-node scripts/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-fitting.ts
 */
import { SdeDataProvider } from '../src/sde';

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
  const sde = SdeDataProvider.fromDirectory(process.env.SDE_DATA_PATH || './sde-data');

  try {
    const RIFTER_TYPE_ID = 587;
    const ship = sde.getType(RIFTER_TYPE_ID);
    if (!ship) {
      console.error(`Type ${RIFTER_TYPE_ID} not found`);
      return;
    }

    const group = sde.getGroup(ship.groupId);
    const category = group ? sde.getCategory(group.categoryId) : null;

    console.log(`=== ${ship.name} ===`);
    console.log(`  ${category?.name} > ${group?.name}`);
    console.log(`  Mass: ${ship.mass} kg`);
    console.log(`  Volume: ${ship.volume} m3`);

    // Look up dogma attributes for this type
    const typeDogma = sde.getTypeDogma(RIFTER_TYPE_ID);
    if (typeDogma && Array.isArray(typeDogma.dogmaAttributes)) {
      console.log('\n--- Fitting Stats ---');

      for (const attr of typeDogma.dogmaAttributes) {
        const attrDef = sde.getDogmaAttribute(
          (attr as { attributeId: number }).attributeId,
        );
        if (attrDef && attrDef.name in FITTING_ATTRIBUTES) {
          const label = FITTING_ATTRIBUTES[attrDef.name];
          const unit = sde.getDogmaUnit(attrDef.unitId ?? 0);
          const unitStr = unit?.displayName ? ` ${unit.displayName}` : '';
          console.log(
            `  ${label}: ${(attr as { value: number }).value}${unitStr}`,
          );
        }
      }
    } else {
      console.log('\n  (No dogma attributes found for this type)');
    }

    // Show other ships in the same group
    if (group) {
      const siblings = sde
        .getTypesByGroup(group.groupId)
        .filter((t) => t.published && t.typeId !== ship.typeId);
      if (siblings.length > 0) {
        console.log(`\n--- Other ${group.name} ---`);
        for (const s of siblings.slice(0, 10)) {
          console.log(`  - ${s.name} (${s.typeId})`);
        }
        if (siblings.length > 10) {
          console.log(`  ... and ${siblings.length - 10} more`);
        }
      }
    }
  } finally {
    sde.close();
  }
}

main();
