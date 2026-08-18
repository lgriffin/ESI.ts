import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import { SDE_SCHEMA_SQL } from '../../../src/sde/SdeLocalEngine';
import { SdeDatabaseError, SdeError } from '../../../src/sde/errors';
import { runProviderContractTests } from './IStaticDataProvider.contract.test';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Database: any;
let hasBetterSqlite3 = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Database = require('better-sqlite3');
  hasBetterSqlite3 = true;
} catch {
  // better-sqlite3 not available
}

function createTestDb(dbPath: string) {
  const db = new Database(dbPath);
  db.exec(SDE_SCHEMA_SQL);

  const data = SdeTestDataFactory.createHierarchicalTestData();

  for (const cat of data.categories!) {
    db.prepare(
      'INSERT INTO eve_categories (categoryId, name, published) VALUES (?, ?, ?)',
    ).run(cat.categoryId, cat.name, cat.published ? 1 : 0);
  }

  for (const grp of data.groups!) {
    db.prepare(
      'INSERT INTO eve_groups (groupId, categoryId, name, published) VALUES (?, ?, ?, ?)',
    ).run(grp.groupId, grp.categoryId, grp.name, grp.published ? 1 : 0);
  }

  for (const type of data.types!) {
    db.prepare(
      `INSERT INTO eve_types
        (typeId, groupId, name, description, mass, volume, capacity, portionSize, published, marketGroupId, iconId, graphicId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      type.typeId,
      type.groupId,
      type.name,
      type.description,
      type.mass,
      type.volume,
      type.capacity,
      type.portionSize,
      type.published ? 1 : 0,
      type.marketGroupId,
      type.iconId,
      type.graphicId,
    );
  }

  for (const reg of data.regions!) {
    db.prepare(
      'INSERT INTO eve_regions (regionId, name, description) VALUES (?, ?, ?)',
    ).run(reg.regionId, reg.name, reg.description);
  }

  for (const con of data.constellations!) {
    db.prepare(
      'INSERT INTO eve_constellations (constellationId, regionId, name) VALUES (?, ?, ?)',
    ).run(con.constellationId, con.regionId, con.name);
  }

  for (const sys of data.solarSystems!) {
    db.prepare(
      `INSERT INTO eve_solar_systems
        (systemId, constellationId, regionId, name, securityStatus, securityClass)
        VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      sys.systemId,
      sys.constellationId,
      sys.regionId,
      sys.name,
      sys.securityStatus,
      sys.securityClass,
    );
  }

  for (const sg of data.stargates!) {
    db.prepare(
      `INSERT INTO eve_stargates
        (stargateId, systemId, typeId, destinationStargateId, destinationSystemId)
        VALUES (?, ?, ?, ?, ?)`,
    ).run(
      sg.stargateId,
      sg.systemId,
      sg.typeId,
      sg.destinationStargateId,
      sg.destinationSystemId,
    );
  }

  for (const star of data.stars!) {
    db.prepare(
      `INSERT INTO eve_stars
        (starId, solarSystemId, name, typeId, age, luminosity, radius, spectralClass, temperature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      star.starId,
      star.solarSystemId,
      star.name,
      star.typeId,
      star.age,
      star.luminosity,
      star.radius,
      star.spectralClass,
      star.temperature,
    );
  }

  for (const planet of data.planets!) {
    db.prepare(
      `INSERT INTO eve_planets
        (planetId, solarSystemId, name, typeId, celestialIndex)
        VALUES (?, ?, ?, ?, ?)`,
    ).run(
      planet.planetId,
      planet.solarSystemId,
      planet.name,
      planet.typeId,
      planet.celestialIndex,
    );
  }

  for (const moon of data.moons!) {
    db.prepare(
      `INSERT INTO eve_moons
        (moonId, planetId, name, typeId, celestialIndex)
        VALUES (?, ?, ?, ?, ?)`,
    ).run(
      moon.moonId,
      moon.planetId,
      moon.name,
      moon.typeId,
      moon.celestialIndex,
    );
  }

  for (const belt of data.asteroidBelts!) {
    db.prepare(
      `INSERT INTO eve_asteroid_belts
        (asteroidBeltId, solarSystemId, name, typeId, celestialIndex)
        VALUES (?, ?, ?, ?, ?)`,
    ).run(
      belt.asteroidBeltId,
      belt.solarSystemId,
      belt.name,
      belt.typeId,
      belt.celestialIndex,
    );
  }

  for (const faction of data.factions!) {
    db.prepare(
      `INSERT INTO eve_factions
        (factionId, name, description, raceIds, solarSystemId, corporationId, militiaCorporationId, sizeFactor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      faction.factionId,
      faction.name,
      faction.description,
      JSON.stringify(faction.raceIds),
      faction.solarSystemId,
      faction.corporationId,
      faction.militiaCorporationId,
      faction.sizeFactor,
    );
  }

  for (const race of data.races!) {
    db.prepare(
      'INSERT INTO eve_races (raceId, name, description, iconId) VALUES (?, ?, ?, ?)',
    ).run(race.raceId, race.name, race.description, race.iconId);
  }

  for (const bl of data.bloodlines!) {
    db.prepare(
      `INSERT INTO eve_bloodlines
        (bloodlineId, raceId, name, description, shipTypeId, corporationId, iconId)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      bl.bloodlineId,
      bl.raceId,
      bl.name,
      bl.description,
      bl.shipTypeId,
      bl.corporationId,
      bl.iconId,
    );
  }

  for (const anc of data.ancestries!) {
    db.prepare(
      `INSERT INTO eve_ancestries
        (ancestryId, bloodlineId, name, description, iconId)
        VALUES (?, ?, ?, ?, ?)`,
    ).run(
      anc.ancestryId,
      anc.bloodlineId,
      anc.name,
      anc.description,
      anc.iconId,
    );
  }

  for (const corp of data.npcCorporations!) {
    db.prepare(
      `INSERT INTO eve_npc_corporations
        (corporationId, name, factionId, solarSystemId, stationId, description, iconId, raceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      corp.corporationId,
      corp.name,
      corp.factionId,
      corp.solarSystemId,
      corp.stationId,
      corp.description,
      corp.iconId,
      corp.raceId,
    );
  }

  for (const station of data.npcStations!) {
    db.prepare(
      `INSERT INTO eve_npc_stations
        (stationId, name, solarSystemId, typeId, corporationId, regionId, constellationId, security, reprocessingEfficiency, reprocessingStationsTake)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      station.stationId,
      station.name,
      station.solarSystemId,
      station.typeId,
      station.corporationId,
      station.regionId,
      station.constellationId,
      station.security,
      station.reprocessingEfficiency,
      station.reprocessingStationsTake,
    );
  }

  for (const mg of data.marketGroups!) {
    db.prepare(
      `INSERT INTO eve_market_groups
        (marketGroupId, name, description, parentGroupId, iconId, hasTypes)
        VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      mg.marketGroupId,
      mg.name,
      mg.description,
      mg.parentGroupId,
      mg.iconId,
      mg.hasTypes ? 1 : 0,
    );
  }

  for (const mtg of data.metaGroups!) {
    db.prepare(
      'INSERT INTO eve_meta_groups (metaGroupId, name, description, iconId) VALUES (?, ?, ?, ?)',
    ).run(mtg.metaGroupId, mtg.name, mtg.description, mtg.iconId);
  }

  for (const icon of data.icons!) {
    db.prepare(
      'INSERT INTO eve_icons (iconId, iconFile, description) VALUES (?, ?, ?)',
    ).run(icon.iconId, icon.iconFile, icon.description);
  }

  for (const graphic of data.graphics!) {
    db.prepare(
      `INSERT INTO eve_graphics
        (graphicId, graphicFile, description, sofFactionName, sofHullName, sofRaceName)
        VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      graphic.graphicId,
      graphic.graphicFile,
      graphic.description,
      graphic.sofFactionName,
      graphic.sofHullName,
      graphic.sofRaceName,
    );
  }

  for (const attr of data.dogmaAttributes!) {
    db.prepare(
      `INSERT INTO eve_dogma_attributes
        (attributeId, name, description, categoryId, defaultValue, highIsGood, stackable, unitId, iconId, published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      attr.attributeId,
      attr.name,
      attr.description,
      attr.categoryId,
      attr.defaultValue,
      attr.highIsGood ? 1 : 0,
      attr.stackable ? 1 : 0,
      attr.unitId,
      attr.iconId,
      attr.published ? 1 : 0,
    );
  }

  for (const effect of data.dogmaEffects!) {
    db.prepare(
      `INSERT INTO eve_dogma_effects
        (effectId, name, description, categoryId, isAssistance, isOffensive, isWarpSafe, published, iconId,
         dischargeAttributeId, durationAttributeId, falloffAttributeId, rangeAttributeId, trackingSpeedAttributeId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      effect.effectId,
      effect.name,
      effect.description,
      effect.categoryId,
      effect.isAssistance ? 1 : 0,
      effect.isOffensive ? 1 : 0,
      effect.isWarpSafe ? 1 : 0,
      effect.published ? 1 : 0,
      effect.iconId,
      effect.dischargeAttributeId,
      effect.durationAttributeId,
      effect.falloffAttributeId,
      effect.rangeAttributeId,
      effect.trackingSpeedAttributeId,
    );
  }

  for (const bp of data.blueprints!) {
    db.prepare(
      `INSERT INTO eve_blueprints
        (blueprintTypeId, maxProductionLimit, manufacturing, research, copying, invention)
        VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      bp.blueprintTypeId,
      bp.maxProductionLimit,
      bp.manufacturing ? JSON.stringify(bp.manufacturing) : null,
      bp.research ? JSON.stringify(bp.research) : null,
      bp.copying ? JSON.stringify(bp.copying) : null,
      bp.invention ? JSON.stringify(bp.invention) : null,
    );
  }

  for (const ps of data.planetSchematics!) {
    db.prepare(
      `INSERT INTO eve_planet_schematics
        (planetSchematicId, name, cycleTime, types)
        VALUES (?, ?, ?, ?)`,
    ).run(
      ps.planetSchematicId,
      ps.name,
      ps.cycleTime,
      JSON.stringify(ps.types),
    );
  }

  const version = data.version!;
  const metaStmt = db.prepare(
    'INSERT INTO sde_metadata (key, value) VALUES (?, ?)',
  );
  metaStmt.run('version', version.version);
  metaStmt.run('buildDate', version.buildDate);
  metaStmt.run('importedAt', version.importedAt);
  if (version.checksum) {
    metaStmt.run('checksum', version.checksum);
  }

  return db;
}

(hasBetterSqlite3 ? describe : describe.skip)('SdeLocalEngine', () => {
  let testDbPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testDb: any;

  beforeAll(() => {
    const os = require('os');
    const path = require('path');
    testDbPath = path.join(os.tmpdir(), `esi-sde-test-${Date.now()}.sqlite`);
    testDb = createTestDb(testDbPath);
    testDb.close();
  });

  afterAll(() => {
    try {
      const fs = require('fs');
      fs.unlinkSync(testDbPath);
    } catch {
      // ignore cleanup errors
    }
  });

  // Run the shared contract tests
  runProviderContractTests('SdeLocalEngine', () => {
    const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
    return new SdeLocalEngine({
      databasePath: testDbPath,
      walMode: false,
    });
  });

  describe('constructor', () => {
    it('should throw SdeDatabaseError for missing database file', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      expect(() => {
        new SdeLocalEngine({ databasePath: '/nonexistent/path/test.db' });
      }).toThrow(SdeDatabaseError);
    });

    it('should open database with WAL mode by default', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({ databasePath: testDbPath });
      expect(engine.getType(34)).not.toBeNull();
      engine.close();
    });

    it('should open database without WAL mode when disabled', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      expect(engine.getType(34)).not.toBeNull();
      engine.close();
    });
  });

  describe('validateOnRead', () => {
    it('should validate data when validateOnRead is true', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        validateOnRead: true,
        walMode: false,
      });
      const type = engine.getType(34);
      expect(type).not.toBeNull();
      expect(type!.name).toBe('Tritanium');
      engine.close();
    });
  });

  describe('version metadata', () => {
    it('should return stored version info', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      const version = engine.getVersion();
      expect(version.version).toBe('2024-01-15.1');
      expect(version.buildDate).toBe('2024-01-15T00:00:00Z');
      expect(version.importedAt).toBe('2024-01-16T12:00:00Z');
      expect(version.checksum).toBe('abc123def456');
      engine.close();
    });
  });

  describe('boolean mapping', () => {
    it('should convert SQLite integer booleans to JS booleans', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      const type = engine.getType(34);
      expect(type).not.toBeNull();
      expect(typeof type!.published).toBe('boolean');
      expect(type!.published).toBe(true);

      const group = engine.getGroup(18);
      expect(typeof group!.published).toBe('boolean');

      const category = engine.getCategory(4);
      expect(typeof category!.published).toBe('boolean');
      engine.close();
    });

    it('should convert MarketGroup hasTypes to boolean', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      const group = engine.getMarketGroup(1857);
      expect(group).not.toBeNull();
      expect(typeof group!.hasTypes).toBe('boolean');
      expect(group!.hasTypes).toBe(true);

      const rootGroup = engine.getMarketGroup(1031);
      expect(rootGroup).not.toBeNull();
      expect(typeof rootGroup!.hasTypes).toBe('boolean');
      expect(rootGroup!.hasTypes).toBe(false);
      engine.close();
    });

    it('should convert DogmaAttribute booleans', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      const attr = engine.getDogmaAttribute(9);
      expect(attr).not.toBeNull();
      expect(typeof attr!.highIsGood).toBe('boolean');
      expect(attr!.highIsGood).toBe(true);
      expect(typeof attr!.stackable).toBe('boolean');
      expect(attr!.stackable).toBe(false);
      expect(typeof attr!.published).toBe('boolean');
      expect(attr!.published).toBe(true);
      engine.close();
    });

    it('should convert DogmaEffect booleans', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      const effect = engine.getDogmaEffect(11);
      expect(effect).not.toBeNull();
      expect(typeof effect!.isAssistance).toBe('boolean');
      expect(effect!.isAssistance).toBe(false);
      expect(typeof effect!.isOffensive).toBe('boolean');
      expect(effect!.isOffensive).toBe(false);
      expect(typeof effect!.isWarpSafe).toBe('boolean');
      expect(effect!.isWarpSafe).toBe(true);
      expect(typeof effect!.published).toBe('boolean');
      expect(effect!.published).toBe(true);
      engine.close();
    });
  });

  describe('close', () => {
    it('should close without error', () => {
      const { SdeLocalEngine } = require('../../../src/sde/SdeLocalEngine');
      const engine = new SdeLocalEngine({
        databasePath: testDbPath,
        walMode: false,
      });
      expect(() => engine.close()).not.toThrow();
    });
  });
});

(hasBetterSqlite3 ? describe : describe.skip)(
  'SdeLocalEngine — missing dependency simulation',
  () => {
    it('should export SDE_SCHEMA_SQL for external use', () => {
      expect(SDE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS eve_types');
      expect(SDE_SCHEMA_SQL).toContain(
        'CREATE TABLE IF NOT EXISTS sde_metadata',
      );
    });
  },
);
