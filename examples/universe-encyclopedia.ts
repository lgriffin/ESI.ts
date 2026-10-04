/**
 * ESI.ts Example: Universe Encyclopedia
 *
 * Demonstrates the full breadth of public universe data endpoints:
 * ancestries, bloodlines, races, factions, categories, constellations,
 * item groups, graphics, systems, jumps, kills, and celestial lookups.
 *
 * Usage: npm run example:universe-encyclopedia
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const JITA_SYSTEM_ID = 30000142;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Universe Encyclopedia\n');

    // --- Lore data ---
    log.info('Fetching lore data...');
    const [ancestries, bloodlines, races, factions] = await Promise.all([
      client.universe.getAncestries(),
      client.universe.getBloodlines(),
      client.universe.getRaces(),
      client.universe.getFactions(),
    ]);

    log.info('Lore Data');
    log.info('-'.repeat(50));
    log.info(`  Ancestries:  ${ancestries.length}`);
    log.info(`  Bloodlines:  ${bloodlines.length}`);
    log.info(`  Races:       ${races.length}`);
    log.info(`  Factions:    ${factions.length}`);

    for (const race of races) {
      log.info(`\n  Race: ${race.name}`);
      const raceBloodlines = bloodlines.filter(
        (b) => b.race_id === race.race_id,
      );
      for (const bl of raceBloodlines) {
        log.info(`    Bloodline: ${bl.name}`);
      }
    }

    // --- Categories & Groups ---
    log.info('\nFetching categories & groups...');
    const [categoryIds, groupIds] = await Promise.all([
      client.universe.getItemCategories(),
      client.universe.getItemGroups(),
    ]);

    log.info(`\nItem Database`);
    log.info('-'.repeat(50));
    log.info(`  Categories: ${categoryIds.length}`);
    log.info(`  Groups:     ${groupIds.length}`);

    const sampleCategory = await client.universe.getItemCategoryById(
      categoryIds[0]!,
    );
    log.info(
      `\n  Sample category: ${sampleCategory.name} (ID: ${sampleCategory.category_id})`,
    );
    log.info(`    Groups in category: ${sampleCategory.groups?.length ?? 0}`);

    const sampleGroup = await client.universe.getItemGroupById(groupIds[0]!);
    log.info(
      `  Sample group: ${sampleGroup.name} (ID: ${sampleGroup.group_id})`,
    );
    log.info(`    Types in group: ${sampleGroup.types?.length ?? 0}`);

    // --- Graphics ---
    const graphicIds = await client.universe.getGraphics();
    log.info(`\nGraphics`);
    log.info('-'.repeat(50));
    log.info(`  Total graphics: ${graphicIds.length}`);

    const sampleGraphic = await client.universe.getGraphicById(graphicIds[0]!);
    log.info(`  Sample: ID ${sampleGraphic.graphic_id}`);

    // --- Systems, Constellations ---
    log.info('\nFetching system data...');
    const [systemIds, constellationIds, systemJumps, systemKills] =
      await Promise.all([
        client.universe.getSystems(),
        client.universe.getConstellations(),
        client.universe.getSystemJumps(),
        client.universe.getSystemKills(),
      ]);

    log.info(`\nGalaxy Statistics`);
    log.info('-'.repeat(50));
    log.info(`  Systems:        ${systemIds.length}`);
    log.info(`  Constellations: ${constellationIds.length}`);
    log.info(`  Systems with jumps reported: ${systemJumps.length}`);
    log.info(`  Systems with kills reported: ${systemKills.length}`);

    const jitaJumps = systemJumps.find((s) => s.system_id === JITA_SYSTEM_ID);
    if (jitaJumps) {
      log.info(
        `\n  Jita traffic: ${jitaJumps.ship_jumps.toLocaleString()} jumps`,
      );
    }

    const jitaKills = systemKills.find((s) => s.system_id === JITA_SYSTEM_ID);
    if (jitaKills) {
      log.info(
        `  Jita kills: ${jitaKills.ship_kills} ships, ${jitaKills.npc_kills} NPCs, ${jitaKills.pod_kills} pods`,
      );
    }

    // --- Celestial lookups (using Jita system objects) ---
    log.info('\nFetching celestial objects...');
    const jitaSystem = await client.universe.getSystemById(JITA_SYSTEM_ID);

    const starInfo = await client.universe.getStarById(jitaSystem.star_id!);
    log.info(`\nCelestial Objects (Jita)`);
    log.info('-'.repeat(50));
    log.info(`  Star: ${starInfo.name} (type ${starInfo.type_id})`);

    if (jitaSystem.planets && jitaSystem.planets.length > 0) {
      const firstPlanet = jitaSystem.planets[0]!;
      const planetInfo = await client.universe.getPlanetById(
        firstPlanet.planet_id,
      );
      log.info(`  Planet: ${planetInfo.name} (type ${planetInfo.type_id})`);

      if (firstPlanet.moons && firstPlanet.moons.length > 0) {
        const moonInfo = await client.universe.getMoonById(
          firstPlanet.moons[0]!,
        );
        log.info(`  Moon: ${moonInfo.name} (type ${moonInfo.type_id})`);
      }

      if (firstPlanet.asteroid_belts && firstPlanet.asteroid_belts.length > 0) {
        const beltInfo = await client.universe.getAsteroidBeltInfo(
          firstPlanet.asteroid_belts[0]!,
        );
        log.info(
          `  Asteroid belt: ${beltInfo.name} (type ${beltInfo.type_id ?? 'unknown'})`,
        );
      }
    }

    if (jitaSystem.stargates && jitaSystem.stargates.length > 0) {
      const gateInfo = await client.universe.getStargateById(
        jitaSystem.stargates[0]!,
      );
      log.info(
        `  Stargate: ${gateInfo.name} -> system ${gateInfo.destination?.system_id}`,
      );
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
