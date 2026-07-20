/**
 * ESI.ts Example: Universe Encyclopedia
 *
 * Demonstrates the full breadth of public universe data endpoints:
 * ancestries, bloodlines, races, factions, categories, constellations,
 * item groups, graphics, systems, jumps, kills, and celestial lookups.
 *
 * Usage: npm run example:universe-encyclopedia
 */
import { EsiClient } from '../src/EsiClient';

const JITA_SYSTEM_ID = 30000142;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Universe Encyclopedia\n');

    // --- Lore data ---
    console.log('Fetching lore data...');
    const [ancestries, bloodlines, races, factions] = await Promise.all([
      client.universe.getAncestries(),
      client.universe.getBloodlines(),
      client.universe.getRaces(),
      client.universe.getFactions(),
    ]);

    console.log('Lore Data');
    console.log('-'.repeat(50));
    console.log(`  Ancestries:  ${ancestries.length}`);
    console.log(`  Bloodlines:  ${bloodlines.length}`);
    console.log(`  Races:       ${races.length}`);
    console.log(`  Factions:    ${factions.length}`);

    for (const race of races) {
      console.log(`\n  Race: ${race.name}`);
      const raceBloodlines = bloodlines.filter(
        (b) => b.race_id === race.race_id,
      );
      for (const bl of raceBloodlines) {
        console.log(`    Bloodline: ${bl.name}`);
      }
    }

    // --- Categories & Groups ---
    console.log('\nFetching categories & groups...');
    const [categoryIds, groupIds] = await Promise.all([
      client.universe.getItemCategories(),
      client.universe.getItemGroups(),
    ]);

    console.log(`\nItem Database`);
    console.log('-'.repeat(50));
    console.log(`  Categories: ${categoryIds.length}`);
    console.log(`  Groups:     ${groupIds.length}`);

    const sampleCategory = await client.universe.getItemCategoryById(
      categoryIds[0]!,
    );
    console.log(
      `\n  Sample category: ${sampleCategory.name} (ID: ${sampleCategory.category_id})`,
    );
    console.log(
      `    Groups in category: ${sampleCategory.groups?.length ?? 0}`,
    );

    const sampleGroup = await client.universe.getItemGroupById(groupIds[0]!);
    console.log(
      `  Sample group: ${sampleGroup.name} (ID: ${sampleGroup.group_id})`,
    );
    console.log(`    Types in group: ${sampleGroup.types?.length ?? 0}`);

    // --- Graphics ---
    const graphicIds = await client.universe.getGraphics();
    console.log(`\nGraphics`);
    console.log('-'.repeat(50));
    console.log(`  Total graphics: ${graphicIds.length}`);

    const sampleGraphic = await client.universe.getGraphicById(graphicIds[0]!);
    console.log(`  Sample: ID ${sampleGraphic.graphic_id}`);

    // --- Systems, Constellations ---
    console.log('\nFetching system data...');
    const [systemIds, constellationIds, systemJumps, systemKills] =
      await Promise.all([
        client.universe.getSystems(),
        client.universe.getConstellations(),
        client.universe.getSystemJumps(),
        client.universe.getSystemKills(),
      ]);

    console.log(`\nGalaxy Statistics`);
    console.log('-'.repeat(50));
    console.log(`  Systems:        ${systemIds.length}`);
    console.log(`  Constellations: ${constellationIds.length}`);
    console.log(`  Systems with jumps reported: ${systemJumps.length}`);
    console.log(`  Systems with kills reported: ${systemKills.length}`);

    const jitaJumps = systemJumps.find((s) => s.system_id === JITA_SYSTEM_ID);
    if (jitaJumps) {
      console.log(
        `\n  Jita traffic: ${jitaJumps.ship_jumps.toLocaleString()} jumps`,
      );
    }

    const jitaKills = systemKills.find((s) => s.system_id === JITA_SYSTEM_ID);
    if (jitaKills) {
      console.log(
        `  Jita kills: ${jitaKills.ship_kills} ships, ${jitaKills.npc_kills} NPCs, ${jitaKills.pod_kills} pods`,
      );
    }

    // --- Celestial lookups (using Jita system objects) ---
    console.log('\nFetching celestial objects...');
    const jitaSystem = await client.universe.getSystemById(JITA_SYSTEM_ID);

    const starInfo = await client.universe.getStarById(jitaSystem.star_id!);
    console.log(`\nCelestial Objects (Jita)`);
    console.log('-'.repeat(50));
    console.log(`  Star: ${starInfo.name} (type ${starInfo.type_id})`);

    if (jitaSystem.planets && jitaSystem.planets.length > 0) {
      const firstPlanet = jitaSystem.planets[0]!;
      const planetInfo = await client.universe.getPlanetById(
        firstPlanet.planet_id,
      );
      console.log(`  Planet: ${planetInfo.name} (type ${planetInfo.type_id})`);

      if (firstPlanet.moons && firstPlanet.moons.length > 0) {
        const moonInfo = await client.universe.getMoonById(
          firstPlanet.moons[0]!,
        );
        console.log(`  Moon: ${moonInfo.name} (type ${moonInfo.type_id})`);
      }

      if (firstPlanet.asteroid_belts && firstPlanet.asteroid_belts.length > 0) {
        const beltInfo = await client.universe.getAsteroidBeltInfo(
          firstPlanet.asteroid_belts[0]!,
        );
        console.log(
          `  Asteroid belt: ${beltInfo.name} (type ${beltInfo.type_id ?? 'unknown'})`,
        );
      }
    }

    if (jitaSystem.stargates && jitaSystem.stargates.length > 0) {
      const gateInfo = await client.universe.getStargateById(
        jitaSystem.stargates[0]!,
      );
      console.log(
        `  Stargate: ${gateInfo.name} -> system ${gateInfo.destination?.system_id}`,
      );
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
