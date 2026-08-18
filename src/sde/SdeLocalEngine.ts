import type { IStaticDataProvider } from './IStaticDataProvider';
import type {
  EveType,
  EveGroup,
  EveCategory,
  Region,
  Constellation,
  SolarSystem,
  Stargate,
  Star,
  Planet,
  Moon,
  AsteroidBelt,
  Faction,
  Race,
  Bloodline,
  Ancestry,
  NpcCorporation,
  NpcStation,
  MarketGroup,
  MetaGroup,
  Icon,
  Graphic,
  DogmaAttribute,
  DogmaEffect,
  Blueprint,
  PlanetSchematic,
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
  StarSchema,
  PlanetSchema,
  MoonSchema,
  AsteroidBeltSchema,
  FactionSchema,
  RaceSchema,
  BloodlineSchema,
  AncestrySchema,
  NpcCorporationSchema,
  NpcStationSchema,
  MarketGroupSchema,
  MetaGroupSchema,
  IconSchema,
  GraphicSchema,
  DogmaAttributeSchema,
  DogmaEffectSchema,
  BlueprintSchema,
  PlanetSchematicSchema,
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

CREATE TABLE IF NOT EXISTS eve_stars (
  starId INTEGER PRIMARY KEY,
  solarSystemId INTEGER NOT NULL,
  name TEXT NOT NULL,
  typeId INTEGER NOT NULL,
  age REAL NOT NULL DEFAULT 0,
  luminosity REAL NOT NULL DEFAULT 0,
  radius REAL NOT NULL DEFAULT 0,
  spectralClass TEXT NOT NULL DEFAULT '',
  temperature REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (solarSystemId) REFERENCES eve_solar_systems(systemId)
);
CREATE INDEX IF NOT EXISTS idx_stars_system ON eve_stars(solarSystemId);

CREATE TABLE IF NOT EXISTS eve_planets (
  planetId INTEGER PRIMARY KEY,
  solarSystemId INTEGER NOT NULL,
  name TEXT NOT NULL,
  typeId INTEGER NOT NULL,
  celestialIndex INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (solarSystemId) REFERENCES eve_solar_systems(systemId)
);
CREATE INDEX IF NOT EXISTS idx_planets_system ON eve_planets(solarSystemId);

CREATE TABLE IF NOT EXISTS eve_moons (
  moonId INTEGER PRIMARY KEY,
  planetId INTEGER NOT NULL,
  name TEXT NOT NULL,
  typeId INTEGER NOT NULL,
  celestialIndex INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (planetId) REFERENCES eve_planets(planetId)
);
CREATE INDEX IF NOT EXISTS idx_moons_planet ON eve_moons(planetId);

CREATE TABLE IF NOT EXISTS eve_asteroid_belts (
  asteroidBeltId INTEGER PRIMARY KEY,
  solarSystemId INTEGER NOT NULL,
  name TEXT NOT NULL,
  typeId INTEGER NOT NULL,
  celestialIndex INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (solarSystemId) REFERENCES eve_solar_systems(systemId)
);
CREATE INDEX IF NOT EXISTS idx_asteroid_belts_system ON eve_asteroid_belts(solarSystemId);

CREATE TABLE IF NOT EXISTS eve_factions (
  factionId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  raceIds TEXT NOT NULL DEFAULT '[]',
  solarSystemId INTEGER,
  corporationId INTEGER,
  militiaCorporationId INTEGER,
  sizeFactor REAL NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS eve_races (
  raceId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  iconId INTEGER
);

CREATE TABLE IF NOT EXISTS eve_bloodlines (
  bloodlineId INTEGER PRIMARY KEY,
  raceId INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  shipTypeId INTEGER NOT NULL,
  corporationId INTEGER NOT NULL,
  iconId INTEGER,
  FOREIGN KEY (raceId) REFERENCES eve_races(raceId)
);
CREATE INDEX IF NOT EXISTS idx_bloodlines_race ON eve_bloodlines(raceId);

CREATE TABLE IF NOT EXISTS eve_ancestries (
  ancestryId INTEGER PRIMARY KEY,
  bloodlineId INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  iconId INTEGER,
  FOREIGN KEY (bloodlineId) REFERENCES eve_bloodlines(bloodlineId)
);
CREATE INDEX IF NOT EXISTS idx_ancestries_bloodline ON eve_ancestries(bloodlineId);

CREATE TABLE IF NOT EXISTS eve_npc_corporations (
  corporationId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  factionId INTEGER,
  solarSystemId INTEGER,
  stationId INTEGER,
  description TEXT NOT NULL DEFAULT '',
  iconId INTEGER,
  raceId INTEGER
);
CREATE INDEX IF NOT EXISTS idx_npc_corps_faction ON eve_npc_corporations(factionId);

CREATE TABLE IF NOT EXISTS eve_npc_stations (
  stationId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  solarSystemId INTEGER NOT NULL,
  typeId INTEGER NOT NULL,
  corporationId INTEGER NOT NULL,
  regionId INTEGER NOT NULL,
  constellationId INTEGER NOT NULL,
  security REAL NOT NULL DEFAULT 0.0,
  reprocessingEfficiency REAL NOT NULL DEFAULT 0.0,
  reprocessingStationsTake REAL NOT NULL DEFAULT 0.0,
  FOREIGN KEY (solarSystemId) REFERENCES eve_solar_systems(systemId)
);
CREATE INDEX IF NOT EXISTS idx_npc_stations_system ON eve_npc_stations(solarSystemId);
CREATE INDEX IF NOT EXISTS idx_npc_stations_corp ON eve_npc_stations(corporationId);
CREATE INDEX IF NOT EXISTS idx_npc_stations_name ON eve_npc_stations(name);

CREATE TABLE IF NOT EXISTS eve_market_groups (
  marketGroupId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  parentGroupId INTEGER,
  iconId INTEGER,
  hasTypes INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_market_groups_parent ON eve_market_groups(parentGroupId);
CREATE INDEX IF NOT EXISTS idx_market_groups_name ON eve_market_groups(name);

CREATE TABLE IF NOT EXISTS eve_meta_groups (
  metaGroupId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  iconId INTEGER
);

CREATE TABLE IF NOT EXISTS eve_icons (
  iconId INTEGER PRIMARY KEY,
  iconFile TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS eve_graphics (
  graphicId INTEGER PRIMARY KEY,
  graphicFile TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sofFactionName TEXT,
  sofHullName TEXT,
  sofRaceName TEXT
);

CREATE TABLE IF NOT EXISTS eve_dogma_attributes (
  attributeId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  categoryId INTEGER,
  defaultValue REAL NOT NULL DEFAULT 0.0,
  highIsGood INTEGER NOT NULL DEFAULT 0,
  stackable INTEGER NOT NULL DEFAULT 0,
  unitId INTEGER,
  iconId INTEGER,
  published INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dogma_attrs_name ON eve_dogma_attributes(name);

CREATE TABLE IF NOT EXISTS eve_dogma_effects (
  effectId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  categoryId INTEGER,
  isAssistance INTEGER NOT NULL DEFAULT 0,
  isOffensive INTEGER NOT NULL DEFAULT 0,
  isWarpSafe INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  iconId INTEGER,
  dischargeAttributeId INTEGER,
  durationAttributeId INTEGER,
  falloffAttributeId INTEGER,
  rangeAttributeId INTEGER,
  trackingSpeedAttributeId INTEGER
);
CREATE INDEX IF NOT EXISTS idx_dogma_effects_name ON eve_dogma_effects(name);

CREATE TABLE IF NOT EXISTS eve_blueprints (
  blueprintTypeId INTEGER PRIMARY KEY,
  maxProductionLimit INTEGER NOT NULL DEFAULT 0,
  manufacturing TEXT,
  research TEXT,
  copying TEXT,
  invention TEXT
);

CREATE TABLE IF NOT EXISTS eve_planet_schematics (
  planetSchematicId INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cycleTime INTEGER NOT NULL DEFAULT 0,
  types TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_planet_schematics_name ON eve_planet_schematics(name);
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

    // Stars
    this.statements.set(
      'getStar',
      this.db.prepare('SELECT * FROM eve_stars WHERE starId = ?'),
    );
    this.statements.set(
      'getStarBySystem',
      this.db.prepare('SELECT * FROM eve_stars WHERE solarSystemId = ?'),
    );

    // Planets
    this.statements.set(
      'getPlanet',
      this.db.prepare('SELECT * FROM eve_planets WHERE planetId = ?'),
    );
    this.statements.set(
      'getPlanetsBySystem',
      this.db.prepare('SELECT * FROM eve_planets WHERE solarSystemId = ?'),
    );

    // Moons
    this.statements.set(
      'getMoon',
      this.db.prepare('SELECT * FROM eve_moons WHERE moonId = ?'),
    );
    this.statements.set(
      'getMoonsByPlanet',
      this.db.prepare('SELECT * FROM eve_moons WHERE planetId = ?'),
    );

    // Asteroid Belts
    this.statements.set(
      'getAsteroidBelt',
      this.db.prepare(
        'SELECT * FROM eve_asteroid_belts WHERE asteroidBeltId = ?',
      ),
    );
    this.statements.set(
      'getAsteroidBeltsBySystem',
      this.db.prepare(
        'SELECT * FROM eve_asteroid_belts WHERE solarSystemId = ?',
      ),
    );

    // Factions
    this.statements.set(
      'getFaction',
      this.db.prepare('SELECT * FROM eve_factions WHERE factionId = ?'),
    );
    this.statements.set(
      'getAllFactions',
      this.db.prepare('SELECT * FROM eve_factions'),
    );

    // Races
    this.statements.set(
      'getRace',
      this.db.prepare('SELECT * FROM eve_races WHERE raceId = ?'),
    );
    this.statements.set(
      'getAllRaces',
      this.db.prepare('SELECT * FROM eve_races'),
    );

    // Bloodlines
    this.statements.set(
      'getBloodline',
      this.db.prepare('SELECT * FROM eve_bloodlines WHERE bloodlineId = ?'),
    );
    this.statements.set(
      'getBloodlinesByRace',
      this.db.prepare('SELECT * FROM eve_bloodlines WHERE raceId = ?'),
    );

    // Ancestries
    this.statements.set(
      'getAncestry',
      this.db.prepare('SELECT * FROM eve_ancestries WHERE ancestryId = ?'),
    );
    this.statements.set(
      'getAncestriesByBloodline',
      this.db.prepare('SELECT * FROM eve_ancestries WHERE bloodlineId = ?'),
    );

    // NPC Corporations
    this.statements.set(
      'getNpcCorporation',
      this.db.prepare(
        'SELECT * FROM eve_npc_corporations WHERE corporationId = ?',
      ),
    );
    this.statements.set(
      'getNpcCorporationsByFaction',
      this.db.prepare('SELECT * FROM eve_npc_corporations WHERE factionId = ?'),
    );

    // NPC Stations
    this.statements.set(
      'getNpcStation',
      this.db.prepare('SELECT * FROM eve_npc_stations WHERE stationId = ?'),
    );
    this.statements.set(
      'getNpcStationsBySystem',
      this.db.prepare('SELECT * FROM eve_npc_stations WHERE solarSystemId = ?'),
    );
    this.statements.set(
      'getNpcStationsByCorporation',
      this.db.prepare('SELECT * FROM eve_npc_stations WHERE corporationId = ?'),
    );
    this.statements.set(
      'searchNpcStationsByName',
      this.db.prepare(
        'SELECT * FROM eve_npc_stations WHERE name LIKE ? LIMIT ?',
      ),
    );

    // Market Groups
    this.statements.set(
      'getMarketGroup',
      this.db.prepare(
        'SELECT * FROM eve_market_groups WHERE marketGroupId = ?',
      ),
    );
    this.statements.set(
      'getMarketGroupsByParent',
      this.db.prepare(
        'SELECT * FROM eve_market_groups WHERE parentGroupId = ?',
      ),
    );
    this.statements.set(
      'getRootMarketGroups',
      this.db.prepare(
        'SELECT * FROM eve_market_groups WHERE parentGroupId IS NULL',
      ),
    );
    this.statements.set(
      'getTypesByMarketGroup',
      this.db.prepare('SELECT * FROM eve_types WHERE marketGroupId = ?'),
    );
    this.statements.set(
      'searchMarketGroupsByName',
      this.db.prepare(
        'SELECT * FROM eve_market_groups WHERE name LIKE ? LIMIT ?',
      ),
    );

    // Meta Groups
    this.statements.set(
      'getMetaGroup',
      this.db.prepare('SELECT * FROM eve_meta_groups WHERE metaGroupId = ?'),
    );
    this.statements.set(
      'getAllMetaGroups',
      this.db.prepare('SELECT * FROM eve_meta_groups'),
    );

    // Icons
    this.statements.set(
      'getIcon',
      this.db.prepare('SELECT * FROM eve_icons WHERE iconId = ?'),
    );

    // Graphics
    this.statements.set(
      'getGraphic',
      this.db.prepare('SELECT * FROM eve_graphics WHERE graphicId = ?'),
    );

    // Dogma Attributes
    this.statements.set(
      'getDogmaAttribute',
      this.db.prepare(
        'SELECT * FROM eve_dogma_attributes WHERE attributeId = ?',
      ),
    );
    this.statements.set(
      'searchDogmaAttributesByName',
      this.db.prepare(
        'SELECT * FROM eve_dogma_attributes WHERE name LIKE ? LIMIT ?',
      ),
    );

    // Dogma Effects
    this.statements.set(
      'getDogmaEffect',
      this.db.prepare('SELECT * FROM eve_dogma_effects WHERE effectId = ?'),
    );
    this.statements.set(
      'searchDogmaEffectsByName',
      this.db.prepare(
        'SELECT * FROM eve_dogma_effects WHERE name LIKE ? LIMIT ?',
      ),
    );

    // Blueprints
    this.statements.set(
      'getBlueprint',
      this.db.prepare('SELECT * FROM eve_blueprints WHERE blueprintTypeId = ?'),
    );

    // Planet Schematics
    this.statements.set(
      'getPlanetSchematic',
      this.db.prepare(
        'SELECT * FROM eve_planet_schematics WHERE planetSchematicId = ?',
      ),
    );
    this.statements.set(
      'getAllPlanetSchematics',
      this.db.prepare('SELECT * FROM eve_planet_schematics'),
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
    jsonFields: string[] = [],
    ...params: unknown[]
  ): T | null {
    const stmt = this.statements.get(stmtName)!;
    const row = stmt.get(...params) as Record<string, unknown> | undefined;
    if (!row) return null;
    const mapped = this.mapBooleans(row, ...booleanFields);
    for (const field of jsonFields) {
      if (field in mapped && typeof mapped[field] === 'string') {
        mapped[field] = JSON.parse(mapped[field]);
      }
    }
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
            mapped['stargateId'] ??
            mapped['starId'] ??
            mapped['planetId'] ??
            mapped['moonId'] ??
            mapped['asteroidBeltId'] ??
            mapped['factionId'] ??
            mapped['raceId'] ??
            mapped['bloodlineId'] ??
            mapped['ancestryId'] ??
            mapped['corporationId'] ??
            mapped['stationId'] ??
            mapped['marketGroupId'] ??
            mapped['metaGroupId'] ??
            mapped['iconId'] ??
            mapped['graphicId'] ??
            mapped['attributeId'] ??
            mapped['effectId'] ??
            mapped['blueprintTypeId'] ??
            mapped['planetSchematicId']) as number | undefined,
        );
      }
    }
    return mapped as T;
  }

  private getMany<T>(
    stmtName: string,
    schema: ZodType<T>,
    booleanFields: string[],
    jsonFields: string[] = [],
    ...params: unknown[]
  ): T[] {
    const stmt = this.statements.get(stmtName)!;
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return rows.map((row) => {
      const mapped = this.mapBooleans(row, ...booleanFields);
      for (const field of jsonFields) {
        if (field in mapped && typeof mapped[field] === 'string') {
          mapped[field] = JSON.parse(mapped[field]);
        }
      }
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

  // --- Types, Groups, Categories ---

  getType(typeId: number): EveType | null {
    return this.getOne('getType', EveTypeSchema, ['published'], [], typeId);
  }

  getTypesByGroup(groupId: number): EveType[] {
    return this.getMany(
      'getTypesByGroup',
      EveTypeSchema,
      ['published'],
      [],
      groupId,
    );
  }

  getGroup(groupId: number): EveGroup | null {
    return this.getOne('getGroup', EveGroupSchema, ['published'], [], groupId);
  }

  getGroupsByCategory(categoryId: number): EveGroup[] {
    return this.getMany(
      'getGroupsByCategory',
      EveGroupSchema,
      ['published'],
      [],
      categoryId,
    );
  }

  getCategory(categoryId: number): EveCategory | null {
    return this.getOne(
      'getCategory',
      EveCategorySchema,
      ['published'],
      [],
      categoryId,
    );
  }

  getAllCategories(): EveCategory[] {
    return this.getMany(
      'getAllCategories',
      EveCategorySchema,
      ['published'],
      [],
    );
  }

  // --- Regions, Constellations, Solar Systems, Stargates ---

  getRegion(regionId: number): Region | null {
    return this.getOne('getRegion', RegionSchema, [], [], regionId);
  }

  getAllRegions(): Region[] {
    return this.getMany('getAllRegions', RegionSchema, [], []);
  }

  getConstellation(constellationId: number): Constellation | null {
    return this.getOne(
      'getConstellation',
      ConstellationSchema,
      [],
      [],
      constellationId,
    );
  }

  getConstellationsByRegion(regionId: number): Constellation[] {
    return this.getMany(
      'getConstellationsByRegion',
      ConstellationSchema,
      [],
      [],
      regionId,
    );
  }

  getSolarSystem(systemId: number): SolarSystem | null {
    return this.getOne('getSolarSystem', SolarSystemSchema, [], [], systemId);
  }

  getSolarSystemsByConstellation(constellationId: number): SolarSystem[] {
    return this.getMany(
      'getSolarSystemsByConstellation',
      SolarSystemSchema,
      [],
      [],
      constellationId,
    );
  }

  getStargate(stargateId: number): Stargate | null {
    return this.getOne('getStargate', StargateSchema, [], [], stargateId);
  }

  getStargatesBySystem(systemId: number): Stargate[] {
    return this.getMany(
      'getStargatesBySystem',
      StargateSchema,
      [],
      [],
      systemId,
    );
  }

  // --- Search ---

  searchTypesByName(query: string, limit = 25): EveType[] {
    return this.getMany(
      'searchTypesByName',
      EveTypeSchema,
      ['published'],
      [],
      `%${query}%`,
      limit,
    );
  }

  searchSolarSystemsByName(query: string, limit = 25): SolarSystem[] {
    return this.getMany(
      'searchSolarSystemsByName',
      SolarSystemSchema,
      [],
      [],
      `%${query}%`,
      limit,
    );
  }

  // --- Stars ---

  getStar(starId: number): Star | null {
    return this.getOne('getStar', StarSchema, [], [], starId);
  }

  getStarBySystem(systemId: number): Star | null {
    return this.getOne('getStarBySystem', StarSchema, [], [], systemId);
  }

  // --- Planets ---

  getPlanet(planetId: number): Planet | null {
    return this.getOne('getPlanet', PlanetSchema, [], [], planetId);
  }

  getPlanetsBySystem(systemId: number): Planet[] {
    return this.getMany('getPlanetsBySystem', PlanetSchema, [], [], systemId);
  }

  // --- Moons ---

  getMoon(moonId: number): Moon | null {
    return this.getOne('getMoon', MoonSchema, [], [], moonId);
  }

  getMoonsByPlanet(planetId: number): Moon[] {
    return this.getMany('getMoonsByPlanet', MoonSchema, [], [], planetId);
  }

  // --- Asteroid Belts ---

  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null {
    return this.getOne(
      'getAsteroidBelt',
      AsteroidBeltSchema,
      [],
      [],
      asteroidBeltId,
    );
  }

  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[] {
    return this.getMany(
      'getAsteroidBeltsBySystem',
      AsteroidBeltSchema,
      [],
      [],
      systemId,
    );
  }

  // --- Factions ---

  getFaction(factionId: number): Faction | null {
    return this.getOne('getFaction', FactionSchema, [], ['raceIds'], factionId);
  }

  getAllFactions(): Faction[] {
    return this.getMany('getAllFactions', FactionSchema, [], ['raceIds']);
  }

  // --- Races ---

  getRace(raceId: number): Race | null {
    return this.getOne('getRace', RaceSchema, [], [], raceId);
  }

  getAllRaces(): Race[] {
    return this.getMany('getAllRaces', RaceSchema, [], []);
  }

  // --- Bloodlines ---

  getBloodline(bloodlineId: number): Bloodline | null {
    return this.getOne('getBloodline', BloodlineSchema, [], [], bloodlineId);
  }

  getBloodlinesByRace(raceId: number): Bloodline[] {
    return this.getMany('getBloodlinesByRace', BloodlineSchema, [], [], raceId);
  }

  // --- Ancestries ---

  getAncestry(ancestryId: number): Ancestry | null {
    return this.getOne('getAncestry', AncestrySchema, [], [], ancestryId);
  }

  getAncestriesByBloodline(bloodlineId: number): Ancestry[] {
    return this.getMany(
      'getAncestriesByBloodline',
      AncestrySchema,
      [],
      [],
      bloodlineId,
    );
  }

  // --- NPC Corporations ---

  getNpcCorporation(corporationId: number): NpcCorporation | null {
    return this.getOne(
      'getNpcCorporation',
      NpcCorporationSchema,
      [],
      [],
      corporationId,
    );
  }

  getNpcCorporationsByFaction(factionId: number): NpcCorporation[] {
    return this.getMany(
      'getNpcCorporationsByFaction',
      NpcCorporationSchema,
      [],
      [],
      factionId,
    );
  }

  // --- NPC Stations ---

  getNpcStation(stationId: number): NpcStation | null {
    return this.getOne('getNpcStation', NpcStationSchema, [], [], stationId);
  }

  getNpcStationsBySystem(systemId: number): NpcStation[] {
    return this.getMany(
      'getNpcStationsBySystem',
      NpcStationSchema,
      [],
      [],
      systemId,
    );
  }

  getNpcStationsByCorporation(corporationId: number): NpcStation[] {
    return this.getMany(
      'getNpcStationsByCorporation',
      NpcStationSchema,
      [],
      [],
      corporationId,
    );
  }

  searchNpcStationsByName(query: string, limit = 25): NpcStation[] {
    return this.getMany(
      'searchNpcStationsByName',
      NpcStationSchema,
      [],
      [],
      `%${query}%`,
      limit,
    );
  }

  // --- Market Groups ---

  getMarketGroup(marketGroupId: number): MarketGroup | null {
    return this.getOne(
      'getMarketGroup',
      MarketGroupSchema,
      ['hasTypes'],
      [],
      marketGroupId,
    );
  }

  getMarketGroupsByParent(parentGroupId: number): MarketGroup[] {
    return this.getMany(
      'getMarketGroupsByParent',
      MarketGroupSchema,
      ['hasTypes'],
      [],
      parentGroupId,
    );
  }

  getRootMarketGroups(): MarketGroup[] {
    return this.getMany(
      'getRootMarketGroups',
      MarketGroupSchema,
      ['hasTypes'],
      [],
    );
  }

  getTypesByMarketGroup(marketGroupId: number): EveType[] {
    return this.getMany(
      'getTypesByMarketGroup',
      EveTypeSchema,
      ['published'],
      [],
      marketGroupId,
    );
  }

  searchMarketGroupsByName(query: string, limit = 25): MarketGroup[] {
    return this.getMany(
      'searchMarketGroupsByName',
      MarketGroupSchema,
      ['hasTypes'],
      [],
      `%${query}%`,
      limit,
    );
  }

  // --- Meta Groups ---

  getMetaGroup(metaGroupId: number): MetaGroup | null {
    return this.getOne('getMetaGroup', MetaGroupSchema, [], [], metaGroupId);
  }

  getAllMetaGroups(): MetaGroup[] {
    return this.getMany('getAllMetaGroups', MetaGroupSchema, [], []);
  }

  // --- Icons ---

  getIcon(iconId: number): Icon | null {
    return this.getOne('getIcon', IconSchema, [], [], iconId);
  }

  // --- Graphics ---

  getGraphic(graphicId: number): Graphic | null {
    return this.getOne('getGraphic', GraphicSchema, [], [], graphicId);
  }

  // --- Dogma Attributes ---

  getDogmaAttribute(attributeId: number): DogmaAttribute | null {
    return this.getOne(
      'getDogmaAttribute',
      DogmaAttributeSchema,
      ['highIsGood', 'stackable', 'published'],
      [],
      attributeId,
    );
  }

  searchDogmaAttributesByName(query: string, limit = 25): DogmaAttribute[] {
    return this.getMany(
      'searchDogmaAttributesByName',
      DogmaAttributeSchema,
      ['highIsGood', 'stackable', 'published'],
      [],
      `%${query}%`,
      limit,
    );
  }

  // --- Dogma Effects ---

  getDogmaEffect(effectId: number): DogmaEffect | null {
    return this.getOne(
      'getDogmaEffect',
      DogmaEffectSchema,
      ['isAssistance', 'isOffensive', 'isWarpSafe', 'published'],
      [],
      effectId,
    );
  }

  searchDogmaEffectsByName(query: string, limit = 25): DogmaEffect[] {
    return this.getMany(
      'searchDogmaEffectsByName',
      DogmaEffectSchema,
      ['isAssistance', 'isOffensive', 'isWarpSafe', 'published'],
      [],
      `%${query}%`,
      limit,
    );
  }

  // --- Blueprints ---

  getBlueprint(blueprintTypeId: number): Blueprint | null {
    return this.getOne(
      'getBlueprint',
      BlueprintSchema,
      [],
      ['manufacturing', 'research', 'copying', 'invention'],
      blueprintTypeId,
    );
  }

  // --- Planet Schematics ---

  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null {
    return this.getOne(
      'getPlanetSchematic',
      PlanetSchematicSchema,
      [],
      ['types'],
      planetSchematicId,
    );
  }

  getAllPlanetSchematics(): PlanetSchematic[] {
    return this.getMany(
      'getAllPlanetSchematics',
      PlanetSchematicSchema,
      [],
      ['types'],
    );
  }

  // --- Version & Lifecycle ---

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
