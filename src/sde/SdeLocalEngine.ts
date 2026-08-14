import type { IStaticDataProvider } from './IStaticDataProvider';
import type {
  EveType,
  EveGroup,
  EveCategory,
  Region,
  Constellation,
  SolarSystem,
  Stargate,
} from './types';
import type { SdeVersionInfo } from './version';
import { SdeError, SdeDatabaseError, SdeValidationError } from './errors';
import {
  EveTypeSchema,
  EveGroupSchema,
  EveCategorySchema,
  RegionSchema,
  ConstellationSchema,
  SolarSystemSchema,
  StargateSchema,
} from './schemas';
import type { ZodType } from 'zod';

export interface SdeLocalEngineConfig {
  databasePath: string;
  walMode?: boolean;
  validateOnRead?: boolean;
}

interface DatabaseLike {
  prepare(sql: string): StatementLike;
  pragma(pragma: string): unknown;
  close(): void;
}

interface StatementLike {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

type BetterSqlite3Constructor = new (
  path: string,
  options?: { readonly?: boolean },
) => DatabaseLike;

export const SDE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sde_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eve_categories (
  categoryId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS eve_groups (
  groupId INTEGER PRIMARY KEY,
  categoryId INTEGER NOT NULL,
  name TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (categoryId) REFERENCES eve_categories(categoryId)
);
CREATE INDEX IF NOT EXISTS idx_groups_category ON eve_groups(categoryId);

CREATE TABLE IF NOT EXISTS eve_types (
  typeId INTEGER PRIMARY KEY,
  groupId INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  mass REAL,
  volume REAL,
  capacity REAL,
  portionSize INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 0,
  marketGroupId INTEGER,
  iconId INTEGER,
  graphicId INTEGER,
  FOREIGN KEY (groupId) REFERENCES eve_groups(groupId)
);
CREATE INDEX IF NOT EXISTS idx_types_group ON eve_types(groupId);
CREATE INDEX IF NOT EXISTS idx_types_name ON eve_types(name);

CREATE TABLE IF NOT EXISTS eve_regions (
  regionId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS eve_constellations (
  constellationId INTEGER PRIMARY KEY,
  regionId INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (regionId) REFERENCES eve_regions(regionId)
);
CREATE INDEX IF NOT EXISTS idx_constellations_region ON eve_constellations(regionId);

CREATE TABLE IF NOT EXISTS eve_solar_systems (
  systemId INTEGER PRIMARY KEY,
  constellationId INTEGER NOT NULL,
  regionId INTEGER NOT NULL,
  name TEXT NOT NULL,
  securityStatus REAL NOT NULL DEFAULT 0.0,
  securityClass TEXT,
  FOREIGN KEY (constellationId) REFERENCES eve_constellations(constellationId),
  FOREIGN KEY (regionId) REFERENCES eve_regions(regionId)
);
CREATE INDEX IF NOT EXISTS idx_systems_constellation ON eve_solar_systems(constellationId);
CREATE INDEX IF NOT EXISTS idx_systems_region ON eve_solar_systems(regionId);
CREATE INDEX IF NOT EXISTS idx_systems_name ON eve_solar_systems(name);

CREATE TABLE IF NOT EXISTS eve_stargates (
  stargateId INTEGER PRIMARY KEY,
  systemId INTEGER NOT NULL,
  typeId INTEGER NOT NULL,
  destinationStargateId INTEGER NOT NULL,
  destinationSystemId INTEGER NOT NULL,
  FOREIGN KEY (systemId) REFERENCES eve_solar_systems(systemId)
);
CREATE INDEX IF NOT EXISTS idx_stargates_system ON eve_stargates(systemId);
`;

export class SdeLocalEngine implements IStaticDataProvider {
  private db: DatabaseLike;
  private readonly validateOnRead: boolean;
  private statements = new Map<string, StatementLike>();

  constructor(config: SdeLocalEngineConfig) {
    let BetterSqlite3: BetterSqlite3Constructor;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      BetterSqlite3 = require('better-sqlite3') as BetterSqlite3Constructor;
    } catch {
      throw new SdeError(
        'better-sqlite3 is required for SdeLocalEngine. ' +
          'Install it with: npm install better-sqlite3',
      );
    }

    try {
      this.db = new BetterSqlite3(config.databasePath, { readonly: true });
    } catch (err) {
      throw new SdeDatabaseError(
        `Failed to open SDE database at ${config.databasePath}`,
        err,
      );
    }

    if (config.walMode !== false) {
      try {
        this.db.pragma('journal_mode = WAL');
      } catch {
        // WAL mode may fail on readonly databases — this is fine
      }
    }
    try {
      this.db.pragma('foreign_keys = ON');
    } catch {
      // May fail on readonly databases
    }
    this.validateOnRead = config.validateOnRead ?? false;

    this.prepareStatements();
  }

  private prepareStatements(): void {
    this.statements.set(
      'getType',
      this.db.prepare('SELECT * FROM eve_types WHERE typeId = ?'),
    );
    this.statements.set(
      'getTypesByGroup',
      this.db.prepare('SELECT * FROM eve_types WHERE groupId = ?'),
    );
    this.statements.set(
      'getGroup',
      this.db.prepare('SELECT * FROM eve_groups WHERE groupId = ?'),
    );
    this.statements.set(
      'getGroupsByCategory',
      this.db.prepare('SELECT * FROM eve_groups WHERE categoryId = ?'),
    );
    this.statements.set(
      'getCategory',
      this.db.prepare('SELECT * FROM eve_categories WHERE categoryId = ?'),
    );
    this.statements.set(
      'getAllCategories',
      this.db.prepare('SELECT * FROM eve_categories'),
    );
    this.statements.set(
      'getRegion',
      this.db.prepare('SELECT * FROM eve_regions WHERE regionId = ?'),
    );
    this.statements.set(
      'getAllRegions',
      this.db.prepare('SELECT * FROM eve_regions'),
    );
    this.statements.set(
      'getConstellation',
      this.db.prepare(
        'SELECT * FROM eve_constellations WHERE constellationId = ?',
      ),
    );
    this.statements.set(
      'getConstellationsByRegion',
      this.db.prepare('SELECT * FROM eve_constellations WHERE regionId = ?'),
    );
    this.statements.set(
      'getSolarSystem',
      this.db.prepare('SELECT * FROM eve_solar_systems WHERE systemId = ?'),
    );
    this.statements.set(
      'getSolarSystemsByConstellation',
      this.db.prepare(
        'SELECT * FROM eve_solar_systems WHERE constellationId = ?',
      ),
    );
    this.statements.set(
      'getStargate',
      this.db.prepare('SELECT * FROM eve_stargates WHERE stargateId = ?'),
    );
    this.statements.set(
      'getStargatesBySystem',
      this.db.prepare('SELECT * FROM eve_stargates WHERE systemId = ?'),
    );
    this.statements.set(
      'searchTypesByName',
      this.db.prepare('SELECT * FROM eve_types WHERE name LIKE ? LIMIT ?'),
    );
    this.statements.set(
      'searchSolarSystemsByName',
      this.db.prepare(
        'SELECT * FROM eve_solar_systems WHERE name LIKE ? LIMIT ?',
      ),
    );
    this.statements.set(
      'getMetadata',
      this.db.prepare('SELECT value FROM sde_metadata WHERE key = ?'),
    );
  }

  private mapBooleans<T extends Record<string, unknown>>(
    row: T,
    ...fields: string[]
  ): T {
    const mapped = { ...row };
    for (const field of fields) {
      if (field in mapped) {
        (mapped as Record<string, unknown>)[field] = Boolean(mapped[field]);
      }
    }
    return mapped;
  }

  private getOne<T>(
    stmtName: string,
    schema: ZodType<T>,
    booleanFields: string[],
    ...params: unknown[]
  ): T | null {
    const stmt = this.statements.get(stmtName)!;
    const row = stmt.get(...params) as Record<string, unknown> | undefined;
    if (!row) return null;
    const mapped = this.mapBooleans(row, ...booleanFields);
    if (this.validateOnRead) {
      try {
        return schema.parse(mapped);
      } catch (err) {
        throw new SdeValidationError(
          stmtName,
          err,
          (mapped['typeId'] ??
            mapped['groupId'] ??
            mapped['categoryId'] ??
            mapped['regionId'] ??
            mapped['constellationId'] ??
            mapped['systemId'] ??
            mapped['stargateId']) as number | undefined,
        );
      }
    }
    return mapped as T;
  }

  private getMany<T>(
    stmtName: string,
    schema: ZodType<T>,
    booleanFields: string[],
    ...params: unknown[]
  ): T[] {
    const stmt = this.statements.get(stmtName)!;
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return rows.map((row) => {
      const mapped = this.mapBooleans(row, ...booleanFields);
      if (this.validateOnRead) {
        try {
          return schema.parse(mapped);
        } catch (err) {
          throw new SdeValidationError(stmtName, err);
        }
      }
      return mapped as T;
    });
  }

  getType(typeId: number): EveType | null {
    return this.getOne('getType', EveTypeSchema, ['published'], typeId);
  }

  getTypesByGroup(groupId: number): EveType[] {
    return this.getMany(
      'getTypesByGroup',
      EveTypeSchema,
      ['published'],
      groupId,
    );
  }

  getGroup(groupId: number): EveGroup | null {
    return this.getOne('getGroup', EveGroupSchema, ['published'], groupId);
  }

  getGroupsByCategory(categoryId: number): EveGroup[] {
    return this.getMany(
      'getGroupsByCategory',
      EveGroupSchema,
      ['published'],
      categoryId,
    );
  }

  getCategory(categoryId: number): EveCategory | null {
    return this.getOne(
      'getCategory',
      EveCategorySchema,
      ['published'],
      categoryId,
    );
  }

  getAllCategories(): EveCategory[] {
    return this.getMany('getAllCategories', EveCategorySchema, ['published']);
  }

  getRegion(regionId: number): Region | null {
    return this.getOne('getRegion', RegionSchema, [], regionId);
  }

  getAllRegions(): Region[] {
    return this.getMany('getAllRegions', RegionSchema, []);
  }

  getConstellation(constellationId: number): Constellation | null {
    return this.getOne(
      'getConstellation',
      ConstellationSchema,
      [],
      constellationId,
    );
  }

  getConstellationsByRegion(regionId: number): Constellation[] {
    return this.getMany(
      'getConstellationsByRegion',
      ConstellationSchema,
      [],
      regionId,
    );
  }

  getSolarSystem(systemId: number): SolarSystem | null {
    return this.getOne('getSolarSystem', SolarSystemSchema, [], systemId);
  }

  getSolarSystemsByConstellation(constellationId: number): SolarSystem[] {
    return this.getMany(
      'getSolarSystemsByConstellation',
      SolarSystemSchema,
      [],
      constellationId,
    );
  }

  getStargate(stargateId: number): Stargate | null {
    return this.getOne('getStargate', StargateSchema, [], stargateId);
  }

  getStargatesBySystem(systemId: number): Stargate[] {
    return this.getMany('getStargatesBySystem', StargateSchema, [], systemId);
  }

  searchTypesByName(query: string, limit = 25): EveType[] {
    return this.getMany(
      'searchTypesByName',
      EveTypeSchema,
      ['published'],
      `%${query}%`,
      limit,
    );
  }

  searchSolarSystemsByName(query: string, limit = 25): SolarSystem[] {
    return this.getMany(
      'searchSolarSystemsByName',
      SolarSystemSchema,
      [],
      `%${query}%`,
      limit,
    );
  }

  getVersion(): SdeVersionInfo {
    const stmt = this.statements.get('getMetadata')!;
    const get = (key: string): string | undefined =>
      (stmt.get(key) as { value: string } | undefined)?.value;

    return {
      version: get('version') ?? 'unknown',
      buildDate: get('buildDate') ?? 'unknown',
      importedAt: get('importedAt') ?? 'unknown',
      checksum: get('checksum'),
    };
  }

  close(): void {
    this.statements.clear();
    this.db.close();
  }
}
