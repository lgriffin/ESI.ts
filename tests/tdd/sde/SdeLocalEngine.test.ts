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
