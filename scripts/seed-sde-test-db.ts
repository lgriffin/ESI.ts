/**
 * Creates a small test SDE SQLite database with sample EVE data.
 * Useful for testing SdeLocalEngine without a full SDE import.
 *
 * Usage: npx ts-node scripts/seed-sde-test-db.ts [output-path]
 */
import Database from 'better-sqlite3';
import { SDE_SCHEMA_SQL } from '../src/sde/SdeLocalEngine';

const outputPath = process.argv[2] || './eve-sde-test.sqlite';

const db = new Database(outputPath);
db.exec(SDE_SCHEMA_SQL);

// --- Categories ---
const insertCategory = db.prepare(
  'INSERT INTO eve_categories (categoryId, name, published) VALUES (?, ?, ?)',
);
insertCategory.run(4, 'Material', 1);
insertCategory.run(6, 'Ship', 1);
insertCategory.run(7, 'Module', 1);
insertCategory.run(8, 'Charge', 1);
insertCategory.run(9, 'Blueprint', 1);

// --- Groups ---
const insertGroup = db.prepare(
  'INSERT INTO eve_groups (groupId, categoryId, name, published) VALUES (?, ?, ?, ?)',
);
insertGroup.run(18, 4, 'Mineral', 1);
insertGroup.run(25, 6, 'Frigate', 1);
insertGroup.run(26, 6, 'Cruiser', 1);
insertGroup.run(27, 6, 'Battleship', 1);
insertGroup.run(74, 8, 'Hybrid Charge', 1);

// --- Types (Minerals) ---
const insertType = db.prepare(
  `INSERT INTO eve_types
    (typeId, groupId, name, description, mass, volume, capacity, portionSize, published, marketGroupId, iconId, graphicId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
insertType.run(34, 18, 'Tritanium', 'The most common mineral in the known universe.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(35, 18, 'Pyerite', 'A common mineral found in many asteroids.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(36, 18, 'Mexallon', 'A moderately common mineral.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(37, 18, 'Isogen', 'A somewhat rare mineral.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(38, 18, 'Nocxium', 'A rare mineral found in specific asteroid types.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(39, 18, 'Zydrine', 'A very rare mineral.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(40, 18, 'Megacyte', 'An extremely rare mineral.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);
insertType.run(11379, 18, 'Morphite', 'An exceedingly rare mineral.', 1.0, 0.01, 0, 1, 1, 1857, null, 20);

// Types (Ships)
insertType.run(587, 25, 'Rifter', 'The Rifter is a very powerful combat frigate.', 1067000, 27289, 130, 1, 1, 378, null, 20);
insertType.run(603, 25, 'Merlin', 'The Merlin is the most common Caldari combat frigate.', 997000, 16500, 130, 1, 1, 378, null, 20);
insertType.run(608, 25, 'Atron', 'The Atron is a fast Gallente frigate.', 1050000, 22500, 130, 1, 1, 378, null, 20);
insertType.run(2161, 25, 'Punisher', 'The Punisher is an Amarr frigate.', 1080000, 28600, 135, 1, 1, 378, null, 20);
insertType.run(24690, 26, 'Caracal', 'The Caracal is a Caldari cruiser.', 11200000, 92000, 450, 1, 1, 379, null, 20);
insertType.run(24692, 26, 'Vexor', 'The Vexor is a Gallente cruiser.', 11000000, 115000, 480, 1, 1, 379, null, 20);
insertType.run(17636, 27, 'Raven', 'The Raven is a Caldari battleship.', 97300000, 486000, 875, 1, 1, 380, null, 20);

// --- Regions ---
const insertRegion = db.prepare(
  'INSERT INTO eve_regions (regionId, name, description) VALUES (?, ?, ?)',
);
insertRegion.run(10000002, 'The Forge', 'The Forge is the industrial heart of the Caldari State.');
insertRegion.run(10000032, 'Sinq Laison', 'A bustling Gallente trade region.');
insertRegion.run(10000043, 'Domain', 'The heart of the Amarr Empire.');
insertRegion.run(10000030, 'Heimatar', 'A key Minmatar region.');
insertRegion.run(10000042, 'Metropolis', 'A major Minmatar trade region.');

// --- Constellations ---
const insertConstellation = db.prepare(
  'INSERT INTO eve_constellations (constellationId, regionId, name) VALUES (?, ?, ?)',
);
insertConstellation.run(20000020, 10000002, 'Kimotoro');
insertConstellation.run(20000016, 10000002, 'Etsala');
insertConstellation.run(20000469, 10000032, 'Coriault');
insertConstellation.run(20000622, 10000043, 'Throne Worlds');

// --- Solar Systems ---
const insertSystem = db.prepare(
  `INSERT INTO eve_solar_systems
    (systemId, constellationId, regionId, name, securityStatus, securityClass)
    VALUES (?, ?, ?, ?, ?, ?)`,
);
insertSystem.run(30000142, 20000020, 10000002, 'Jita', 0.9459991455078125, 'B');
insertSystem.run(30000144, 20000020, 10000002, 'Perimeter', 0.9, 'B');
insertSystem.run(30000143, 20000020, 10000002, 'New Caldari', 1.0, 'A');
insertSystem.run(30002187, 20000016, 10000002, 'Sobaseki', 0.879, 'B');
insertSystem.run(30003491, 20000469, 10000032, 'Dodixie', 0.8763, 'B');
insertSystem.run(30002659, 20000622, 10000043, 'Amarr', 1.0, 'A');

// --- Stargates ---
const insertStargate = db.prepare(
  `INSERT INTO eve_stargates
    (stargateId, systemId, typeId, destinationStargateId, destinationSystemId)
    VALUES (?, ?, ?, ?, ?)`,
);
insertStargate.run(50001248, 30000142, 16, 50001249, 30000144); // Jita -> Perimeter
insertStargate.run(50001249, 30000144, 16, 50001248, 30000142); // Perimeter -> Jita
insertStargate.run(50001250, 30000142, 16, 50001251, 30000143); // Jita -> New Caldari
insertStargate.run(50001251, 30000143, 16, 50001250, 30000142); // New Caldari -> Jita

// --- Metadata ---
const insertMeta = db.prepare(
  'INSERT INTO sde_metadata (key, value) VALUES (?, ?)',
);
insertMeta.run('version', '2024-01-15.1');
insertMeta.run('buildDate', '2024-01-15T00:00:00Z');
insertMeta.run('importedAt', new Date().toISOString());
insertMeta.run('checksum', 'test-seed-database');

db.close();

console.log(`SDE test database created at: ${outputPath}`);
console.log('  5 categories, 5 groups, 15 types');
console.log('  5 regions, 4 constellations, 6 solar systems, 4 stargates');
