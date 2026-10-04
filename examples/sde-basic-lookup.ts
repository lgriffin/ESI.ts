/**
 * ESI.ts Example: SDE Basic Lookup
 *
 * Demonstrates looking up static game data using the SDE module.
 * Requires SDE YAML files extracted to a local directory.
 *
 * Setup: npx ts-node scripts/sde/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-basic-lookup.ts
 *
 * @nightly sde
 */
import { SdeDataProvider } from '../src/sde';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

function main() {
  const sdeDir = process.env.SDE_DATA_PATH || './sde-data';
  const sde = SdeDataProvider.fromDirectory(sdeDir);

  try {
    const version = sde.getVersion();
    log.info(`SDE Version: ${version.version} (built ${version.buildDate})\n`);

    // Look up Tritanium
    const tritanium = sde.getType(34);
    if (tritanium) {
      log.info(`Type: ${tritanium.name} (ID: ${tritanium.typeId})`);
      log.info(`  Volume: ${tritanium.volume}`);
      log.info(`  Published: ${tritanium.published}`);

      const group = sde.getGroup(tritanium.groupId);
      if (group) {
        log.info(`  Group: ${group.name}`);
        const category = sde.getCategory(group.categoryId);
        log.info(`  Category: ${category?.name}`);

        const siblings = sde.getTypesByGroup(group.groupId);
        log.info(
          `  Types in ${group.name}: ${siblings.map((t) => t.name).join(', ')}`,
        );
      }
    }

    // Geography
    log.info('\n--- Geography ---');
    const regions = sde.getAllRegions();
    log.info(`Total regions: ${regions.length}`);

    const jita = sde.getSolarSystem(30000142);
    if (jita) {
      log.info(`\nJita: security ${jita.securityStatus.toFixed(2)}`);
      const constellation = sde.getConstellation(jita.constellationId);
      const region = sde.getRegion(jita.regionId);
      log.info(
        `  Location: ${region?.name} > ${constellation?.name} > ${jita.name}`,
      );

      const star = sde.getStarBySystem(jita.systemId);
      if (star) {
        log.info(
          `  Star: type ${star.typeId}, spectral class ${star.statistics.spectralClass}`,
        );
      }

      const gates = sde.getStargatesBySystem(jita.systemId);
      log.info(`  Stargates: ${gates.length}`);
      for (const gate of gates) {
        const dest = sde.getSolarSystem(gate.destination.solarSystemId);
        log.info(`    -> ${dest?.name ?? 'Unknown'}`);
      }

      const planets = sde.getPlanetsBySystem(jita.systemId);
      log.info(`  Planets: ${planets.length}`);

      const moons = sde.getMoonsBySystem(jita.systemId);
      log.info(`  Moons: ${moons.length}`);
    }

    // Search
    log.info('\n--- Search ---');
    const searchResults = sde.searchTypesByName('Rifter', 5);
    log.info(`Search "Rifter": ${searchResults.length} results`);
    for (const r of searchResults) {
      log.info(`  - ${r.name} (${r.typeId})`);
    }
  } finally {
    sde.close();
  }
}

main();
