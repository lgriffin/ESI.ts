/**
 * ESI.ts Example: SDE Basic Lookup
 *
 * Demonstrates looking up static game data using the SDE module.
 * Requires SDE YAML files extracted to a local directory.
 *
 * Setup: npx ts-node scripts/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-basic-lookup.ts
 */
import { SdeDataProvider } from '../src/sde';

function main() {
  const sdeDir = process.env.SDE_DATA_PATH || './sde-data';
  const sde = SdeDataProvider.fromDirectory(sdeDir);

  try {
    const version = sde.getVersion();
    console.log(`SDE Version: ${version.version} (built ${version.buildDate})\n`);

    // Look up Tritanium
    const tritanium = sde.getType(34);
    if (tritanium) {
      console.log(`Type: ${tritanium.name} (ID: ${tritanium.typeId})`);
      console.log(`  Volume: ${tritanium.volume}`);
      console.log(`  Published: ${tritanium.published}`);

      const group = sde.getGroup(tritanium.groupId);
      if (group) {
        console.log(`  Group: ${group.name}`);
        const category = sde.getCategory(group.categoryId);
        console.log(`  Category: ${category?.name}`);

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

      const star = sde.getStarBySystem(jita.systemId);
      if (star) {
        console.log(`  Star: type ${star.typeId}, spectral class ${star.statistics.spectralClass}`);
      }

      const gates = sde.getStargatesBySystem(jita.systemId);
      console.log(`  Stargates: ${gates.length}`);
      for (const gate of gates) {
        const dest = sde.getSolarSystem(gate.destination.solarSystemId);
        console.log(`    -> ${dest?.name ?? 'Unknown'}`);
      }

      const planets = sde.getPlanetsBySystem(jita.systemId);
      console.log(`  Planets: ${planets.length}`);

      const moons = sde.getMoonsBySystem(jita.systemId);
      console.log(`  Moons: ${moons.length}`);
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

main();
