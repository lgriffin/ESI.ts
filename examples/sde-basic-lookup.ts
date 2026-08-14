/**
 * ESI.ts Example: SDE Basic Lookup
 *
 * Demonstrates looking up static game data using the SDE module.
 * Requires a pre-built SDE SQLite database file.
 *
 * Usage: npm run example:sde-basic
 */
import { SdeLocalEngine } from '../src/sde';

async function main() {
  const dbPath = process.env.SDE_DATABASE_PATH || './eve-sde.sqlite';
  const sde = new SdeLocalEngine({ databasePath: dbPath });

  try {
    // Version info
    const version = sde.getVersion();
    console.log(`SDE Version: ${version.version} (built ${version.buildDate})\n`);

    // Look up Tritanium
    const tritanium = sde.getType(34);
    if (tritanium) {
      console.log(`Type: ${tritanium.name} (ID: ${tritanium.typeId})`);
      console.log(`  Volume: ${tritanium.volume}`);
      console.log(`  Published: ${tritanium.published}`);

      // Navigate the type hierarchy
      const group = sde.getGroup(tritanium.groupId);
      if (group) {
        console.log(`  Group: ${group.name}`);
        const category = sde.getCategory(group.categoryId);
        console.log(`  Category: ${category?.name}`);

        // Find all types in the same group
        const siblings = sde.getTypesByGroup(group.groupId);
        console.log(`  Types in ${group.name}: ${siblings.map((t) => t.name).join(', ')}`);
      }
    }

    // Geography
    console.log('\n--- Geography ---');
    const regions = sde.getAllRegions();
    console.log(`Total regions: ${regions.length}`);

    const jita = sde.getSolarSystem(30000142);
    if (jita) {
      console.log(`\nJita: security ${jita.securityStatus.toFixed(2)}`);
      const constellation = sde.getConstellation(jita.constellationId);
      const region = sde.getRegion(jita.regionId);
      console.log(`  Location: ${region?.name} > ${constellation?.name} > ${jita.name}`);

      const gates = sde.getStargatesBySystem(jita.systemId);
      console.log(`  Stargates: ${gates.length}`);
      for (const gate of gates) {
        const dest = sde.getSolarSystem(gate.destinationSystemId);
        console.log(`    → ${dest?.name ?? 'Unknown'}`);
      }
    }

    // Search
    console.log('\n--- Search ---');
    const searchResults = sde.searchTypesByName('Rifter', 5);
    console.log(`Search "Rifter": ${searchResults.length} results`);
    for (const r of searchResults) {
      console.log(`  - ${r.name} (${r.typeId})`);
    }
  } finally {
    sde.close();
  }
}

main().catch(console.error);
