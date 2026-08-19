import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import AdmZip from 'adm-zip';
import { SdeDataProvider } from '../../../src/sde/SdeDataProvider';
import { SdeError } from '../../../src/sde/errors';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sde-test-'));
}

function writeYaml(dir: string, filename: string, data: unknown): void {
  fs.writeFileSync(path.join(dir, filename), yaml.dump(data), 'utf-8');
}

function createSdeDirectory(): string {
  const dir = createTempDir();

  writeYaml(dir, '_sde.yaml', {
    buildNumber: '2025-09-15.1',
    releaseDate: '2025-09-15',
    sde: { buildNumber: '2025-09-15.1', releaseDate: '2025-09-15' },
  });

  writeYaml(dir, 'types.yaml', {
    34: {
      name: { en: 'Tritanium' },
      groupID: 18,
      published: true,
      mass: 1,
      volume: 0.01,
    },
    35: {
      name: { en: 'Pyerite' },
      groupID: 18,
      published: true,
      mass: 1,
      volume: 0.01,
    },
    36: {
      name: { en: 'Mexallon' },
      groupID: 18,
      published: true,
      mass: 1,
      volume: 0.01,
    },
  });

  writeYaml(dir, 'groups.yaml', {
    18: { name: { en: 'Mineral' }, categoryID: 4, published: true },
    25: { name: { en: 'Frigate' }, categoryID: 6, published: true },
  });

  writeYaml(dir, 'categories.yaml', {
    4: { name: { en: 'Material' }, published: true },
    6: { name: { en: 'Ship' }, published: true },
  });

  writeYaml(dir, 'mapRegions.yaml', {
    10000002: { name: { en: 'The Forge' } },
  });

  writeYaml(dir, 'mapConstellations.yaml', {
    20000020: { name: { en: 'Kimotoro' }, regionID: 10000002 },
  });

  writeYaml(dir, 'mapSolarSystems.yaml', {
    30000142: {
      name: { en: 'Jita' },
      constellationID: 20000020,
      securityStatus: 0.9459,
    },
  });

  writeYaml(dir, 'mapStargates.yaml', {
    50001248: {
      solarSystemID: 30000142,
      destination: { solarSystemID: 30000140, stargateID: 50000802 },
    },
  });

  writeYaml(dir, 'mapStars.yaml', {
    40009082: { solarSystemID: 30000142 },
  });

  writeYaml(dir, 'mapPlanets.yaml', {
    40009077: { solarSystemID: 30000142 },
  });

  writeYaml(dir, 'mapMoons.yaml', {
    40009078: { solarSystemID: 30000142 },
  });

  writeYaml(dir, 'mapAsteroidBelts.yaml', {
    40009079: { solarSystemID: 30000142 },
  });

  writeYaml(dir, 'factions.yaml', {
    500001: { name: { en: 'Caldari State' }, memberRaces: [1] },
  });

  writeYaml(dir, 'races.yaml', {
    1: { name: { en: 'Caldari' } },
  });

  writeYaml(dir, 'bloodlines.yaml', {
    1: { name: { en: 'Deteis' }, raceID: 1 },
  });

  writeYaml(dir, 'ancestries.yaml', {
    1: { name: { en: 'Tube Child' }, bloodlineID: 1 },
  });

  writeYaml(dir, 'npcCorporations.yaml', {
    1000035: { name: { en: 'Caldari Navy' }, factionID: 500001 },
  });

  writeYaml(dir, 'npcStations.yaml', {
    60003760: { solarSystemID: 30000142, ownerID: 1000035 },
  });

  writeYaml(dir, 'marketGroups.yaml', {
    1857: { name: { en: 'Minerals' }, parentGroupID: 1031 },
    1031: { name: { en: 'Materials & Research' } },
  });

  writeYaml(dir, 'metaGroups.yaml', {
    1: { name: { en: 'Tech I' } },
  });

  writeYaml(dir, 'icons.yaml', {
    22: { iconFile: 'res:/UI/Texture/Icons/22.png' },
  });

  writeYaml(dir, 'graphics.yaml', {
    20: { graphicFile: 'res:/dx9/model/ship/rifter.red' },
  });

  writeYaml(dir, 'dogmaAttributes.yaml', {
    9: { name: { en: 'hp' }, description: { en: 'Structure hitpoints' } },
  });

  writeYaml(dir, 'dogmaEffects.yaml', {
    11: { name: { en: 'lowPower' }, description: { en: 'Low slot' } },
  });

  writeYaml(dir, 'blueprints.yaml', {
    787: {
      activities: {
        manufacturing: {
          time: 6000,
          materials: [{ typeID: 34, quantity: 100 }],
        },
      },
    },
  });

  writeYaml(dir, 'planetSchematics.yaml', {
    65: { name: { en: 'Bacteria' } },
  });

  return dir;
}

function createSdeZip(dir: string): string {
  const zipPath = path.join(os.tmpdir(), `sde-test-${Date.now()}.zip`);
  const zip = new AdmZip();

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file));
    zip.addFile(file, content);
  }

  zip.writeZip(zipPath);
  return zipPath;
}

describe('SdeDataProvider', () => {
  let tempDir: string;
  let provider: SdeDataProvider;

  beforeAll(() => {
    tempDir = createSdeDirectory();
    provider = SdeDataProvider.fromDirectory(tempDir);
  });

  afterAll(() => {
    provider.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------
  // fromDirectory
  // ---------------------------------------------------------------

  describe('fromDirectory', () => {
    it('should throw SdeError for nonexistent directory', () => {
      expect(() => SdeDataProvider.fromDirectory('/nonexistent/path')).toThrow(
        SdeError,
      );
    });

    it('should load version info from _sde.yaml', () => {
      const version = provider.getVersion();
      expect(version.version).toBe('2025-09-15.1');
      expect(version.buildDate).toBe('2025-09-15');
      expect(version.importedAt).toBeDefined();
    });

    it('should handle _sde.yaml without nested sde block', () => {
      const dir = createTempDir();
      writeYaml(dir, '_sde.yaml', {
        buildNumber: '42',
        releaseDate: '2025-01-01',
      });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getVersion().version).toBe('42');
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should handle missing _sde.yaml gracefully', () => {
      const dir = createTempDir();
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getVersion().version).toBe('unknown');
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should handle _sde.yaml with numeric buildNumber', () => {
      const dir = createTempDir();
      writeYaml(dir, '_sde.yaml', {
        sde: { buildNumber: 12345, releaseDate: 20250915 },
      });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getVersion().version).toBe('12345');
      expect(p.getVersion().buildDate).toBe('20250915');
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should handle _sde.yaml with missing buildNumber', () => {
      const dir = createTempDir();
      writeYaml(dir, '_sde.yaml', { sde: { otherField: 'value' } });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getVersion().version).toBe('unknown');
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should skip missing YAML files silently', () => {
      const dir = createTempDir();
      writeYaml(dir, 'types.yaml', {
        34: { name: { en: 'Tritanium' }, groupID: 18 },
      });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getType(34)).not.toBeNull();
      expect(p.getRegion(10000002)).toBeNull();
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should skip YAML files that parse to null', () => {
      const dir = createTempDir();
      fs.writeFileSync(path.join(dir, 'types.yaml'), 'null\n', 'utf-8');
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getType(34)).toBeNull();
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('should skip null records within a YAML file', () => {
      const dir = createTempDir();
      writeYaml(dir, 'types.yaml', {
        34: { name: { en: 'Tritanium' } },
        35: null,
      });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getType(34)).not.toBeNull();
      expect(p.getType(35)).toBeNull();
      p.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });
  });

  // ---------------------------------------------------------------
  // fromZip
  // ---------------------------------------------------------------

  describe('fromZip', () => {
    it('should throw SdeError for nonexistent ZIP file', () => {
      expect(() => SdeDataProvider.fromZip('/nonexistent/path.zip')).toThrow(
        SdeError,
      );
    });

    it('should load data from a ZIP archive', () => {
      const zipPath = createSdeZip(tempDir);
      const p = SdeDataProvider.fromZip(zipPath);
      try {
        expect(p.getVersion().version).toBe('2025-09-15.1');
        expect(p.getType(34)).not.toBeNull();
        expect(p.getType(34)!.name).toBe('Tritanium');
        expect(p.getRegion(10000002)).not.toBeNull();
      } finally {
        p.close();
        fs.unlinkSync(zipPath);
      }
    });
  });

  // ---------------------------------------------------------------
  // getById — Types, Groups, Categories
  // ---------------------------------------------------------------

  describe('Types, Groups, Categories', () => {
    it('should get a type by ID', () => {
      const type = provider.getType(34);
      expect(type).not.toBeNull();
      expect(type!.name).toBe('Tritanium');
    });

    it('should return null for nonexistent type', () => {
      expect(provider.getType(99999)).toBeNull();
    });

    it('should normalize groupID to groupId', () => {
      const type = provider.getType(34);
      expect(type).toHaveProperty('groupId', 18);
    });

    it('should extract locale from name field', () => {
      const type = provider.getType(34);
      expect(typeof type!.name).toBe('string');
      expect(type!.name).toBe('Tritanium');
    });

    it('should get types by group (FK query)', () => {
      const minerals = provider.getTypesByGroup(18);
      expect(minerals).toHaveLength(3);
      const names = minerals.map((t) => t.name);
      expect(names).toContain('Tritanium');
      expect(names).toContain('Pyerite');
      expect(names).toContain('Mexallon');
    });

    it('should return empty array for nonexistent group FK', () => {
      expect(provider.getTypesByGroup(99999)).toEqual([]);
    });

    it('should cache FK index on second call', () => {
      const first = provider.getTypesByGroup(18);
      const second = provider.getTypesByGroup(18);
      expect(first).toEqual(second);
    });

    it('should get a group by ID', () => {
      const group = provider.getGroup(18);
      expect(group).not.toBeNull();
      expect(group!.name).toBe('Mineral');
    });

    it('should get groups by category', () => {
      const groups = provider.getGroupsByCategory(4);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.name).toBe('Mineral');
    });

    it('should get a category by ID', () => {
      const cat = provider.getCategory(4);
      expect(cat).not.toBeNull();
      expect(cat!.name).toBe('Material');
    });

    it('should get all categories', () => {
      const cats = provider.getAllCategories();
      expect(cats.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------
  // Geography
  // ---------------------------------------------------------------

  describe('Geography', () => {
    it('should get a region by ID', () => {
      const region = provider.getRegion(10000002);
      expect(region).not.toBeNull();
      expect(region!.name).toBe('The Forge');
    });

    it('should get all regions', () => {
      expect(provider.getAllRegions()).toHaveLength(1);
    });

    it('should get a constellation by ID', () => {
      const c = provider.getConstellation(20000020);
      expect(c).not.toBeNull();
      expect(c!.name).toBe('Kimotoro');
    });

    it('should get constellations by region', () => {
      const cs = provider.getConstellationsByRegion(10000002);
      expect(cs).toHaveLength(1);
    });

    it('should get a solar system by ID', () => {
      const sys = provider.getSolarSystem(30000142);
      expect(sys).not.toBeNull();
      expect(sys!.name).toBe('Jita');
    });

    it('should get solar systems by constellation', () => {
      const systems = provider.getSolarSystemsByConstellation(20000020);
      expect(systems).toHaveLength(1);
    });

    it('should get a stargate by ID', () => {
      const gate = provider.getStargate(50001248);
      expect(gate).not.toBeNull();
    });

    it('should normalize nested stargate destination', () => {
      const gate = provider.getStargate(50001248);
      expect(gate).not.toBeNull();
      const dest = gate!.destination as unknown as Record<string, unknown>;
      expect(dest).toHaveProperty('solarSystemId', 30000140);
      expect(dest).toHaveProperty('stargateId', 50000802);
    });

    it('should get stargates by system', () => {
      const gates = provider.getStargatesBySystem(30000142);
      expect(gates).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Universe — Stars, Planets, Moons, Asteroid Belts
  // ---------------------------------------------------------------

  describe('Universe', () => {
    it('should get a star by ID', () => {
      expect(provider.getStar(40009082)).not.toBeNull();
    });

    it('should get star by system', () => {
      expect(provider.getStarBySystem(30000142)).not.toBeNull();
    });

    it('should return null for star in nonexistent system', () => {
      expect(provider.getStarBySystem(99999)).toBeNull();
    });

    it('should get a planet by ID', () => {
      expect(provider.getPlanet(40009077)).not.toBeNull();
    });

    it('should get planets by system', () => {
      expect(provider.getPlanetsBySystem(30000142)).toHaveLength(1);
    });

    it('should get a moon by ID', () => {
      expect(provider.getMoon(40009078)).not.toBeNull();
    });

    it('should get moons by system', () => {
      expect(provider.getMoonsBySystem(30000142)).toHaveLength(1);
    });

    it('should get an asteroid belt by ID', () => {
      expect(provider.getAsteroidBelt(40009079)).not.toBeNull();
    });

    it('should get asteroid belts by system', () => {
      expect(provider.getAsteroidBeltsBySystem(30000142)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Character/Lore
  // ---------------------------------------------------------------

  describe('Character/Lore', () => {
    it('should get a faction by ID', () => {
      const f = provider.getFaction(500001);
      expect(f).not.toBeNull();
      expect(f!.name).toBe('Caldari State');
    });

    it('should get all factions', () => {
      expect(provider.getAllFactions()).toHaveLength(1);
    });

    it('should get a race by ID', () => {
      expect(provider.getRace(1)!.name).toBe('Caldari');
    });

    it('should get all races', () => {
      expect(provider.getAllRaces()).toHaveLength(1);
    });

    it('should get a bloodline by ID', () => {
      expect(provider.getBloodline(1)!.name).toBe('Deteis');
    });

    it('should get bloodlines by race', () => {
      expect(provider.getBloodlinesByRace(1)).toHaveLength(1);
    });

    it('should get an ancestry by ID', () => {
      expect(provider.getAncestry(1)!.name).toBe('Tube Child');
    });

    it('should get ancestries by bloodline', () => {
      expect(provider.getAncestriesByBloodline(1)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // NPC Infrastructure
  // ---------------------------------------------------------------

  describe('NPC Infrastructure', () => {
    it('should get an NPC corporation by ID', () => {
      const corp = provider.getNpcCorporation(1000035);
      expect(corp).not.toBeNull();
      expect(corp!.name).toBe('Caldari Navy');
    });

    it('should get NPC corporations by faction', () => {
      expect(provider.getNpcCorporationsByFaction(500001)).toHaveLength(1);
    });

    it('should get an NPC station by ID', () => {
      expect(provider.getNpcStation(60003760)).not.toBeNull();
    });

    it('should get NPC stations by system', () => {
      expect(provider.getNpcStationsBySystem(30000142)).toHaveLength(1);
    });

    it('should get NPC stations by owner', () => {
      expect(provider.getNpcStationsByOwner(1000035)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Market
  // ---------------------------------------------------------------

  describe('Market', () => {
    it('should get a market group by ID', () => {
      const mg = provider.getMarketGroup(1857);
      expect(mg).not.toBeNull();
      expect(mg!.name).toBe('Minerals');
    });

    it('should get market groups by parent', () => {
      expect(provider.getMarketGroupsByParent(1031)).toHaveLength(1);
    });

    it('should get root market groups (no parent)', () => {
      const roots = provider.getRootMarketGroups();
      expect(roots.length).toBeGreaterThanOrEqual(1);
      const rootNames = roots.map((r) => r.name);
      expect(rootNames).toContain('Materials & Research');
    });

    it('should search market groups by name', () => {
      const results = provider.searchMarketGroupsByName('mineral');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Minerals');
    });
  });

  // ---------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------

  describe('Search', () => {
    it('should search types by name (case insensitive)', () => {
      const results = provider.searchTypesByName('trit');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Tritanium');
    });

    it('should respect search limit', () => {
      const results = provider.searchTypesByName('', 2);
      expect(results).toHaveLength(2);
    });

    it('should search solar systems by name', () => {
      const results = provider.searchSolarSystemsByName('jita');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no match', () => {
      expect(provider.searchTypesByName('zzzznotfound')).toEqual([]);
    });

    it('should search dogma attributes by name', () => {
      const results = provider.searchDogmaAttributesByName('hp');
      expect(results).toHaveLength(1);
    });

    it('should search dogma effects by name', () => {
      const results = provider.searchDogmaEffectsByName('low');
      expect(results).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Meta/UI
  // ---------------------------------------------------------------

  describe('Meta/UI', () => {
    it('should get a meta group by ID', () => {
      const mg = provider.getMetaGroup(1);
      expect(mg).not.toBeNull();
      expect(mg!.name).toBe('Tech I');
    });

    it('should get all meta groups', () => {
      expect(provider.getAllMetaGroups()).toHaveLength(1);
    });

    it('should get an icon by ID', () => {
      expect(provider.getIcon(22)).not.toBeNull();
    });

    it('should get a graphic by ID', () => {
      expect(provider.getGraphic(20)).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Dogma
  // ---------------------------------------------------------------

  describe('Dogma', () => {
    it('should get a dogma attribute by ID', () => {
      const attr = provider.getDogmaAttribute(9);
      expect(attr).not.toBeNull();
      expect(attr!.name).toBe('hp');
    });

    it('should get a dogma effect by ID', () => {
      const effect = provider.getDogmaEffect(11);
      expect(effect).not.toBeNull();
      expect(effect!.name).toBe('lowPower');
    });
  });

  // ---------------------------------------------------------------
  // Industry
  // ---------------------------------------------------------------

  describe('Industry', () => {
    it('should get a blueprint by ID', () => {
      const bp = provider.getBlueprint(787);
      expect(bp).not.toBeNull();
    });

    it('should preserve nested blueprint activities as native object', () => {
      const bp = provider.getBlueprint(787);
      expect(bp!.activities).toBeDefined();
      expect(typeof bp!.activities).toBe('object');
    });

    it('should get a planet schematic by ID', () => {
      expect(provider.getPlanetSchematic(65)).not.toBeNull();
    });

    it('should get all planet schematics', () => {
      expect(provider.getAllPlanetSchematics()).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Generic entity accessors
  // ---------------------------------------------------------------

  describe('Generic entity accessors', () => {
    it('should get an entity by table name and ID', () => {
      const entity = provider.getEntity('eve_types', 34);
      expect(entity).not.toBeNull();
    });

    it('should return null for nonexistent table', () => {
      expect(provider.getEntity('nonexistent_table', 1)).toBeNull();
    });

    it('should get all entities for a table', () => {
      const all = provider.getAllEntities('eve_types');
      expect(all).toHaveLength(3);
    });

    it('should return empty array for nonexistent table', () => {
      expect(provider.getAllEntities('nonexistent_table')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // Version & Lifecycle
  // ---------------------------------------------------------------

  describe('Version & Lifecycle', () => {
    it('should return a copy of version info', () => {
      const v1 = provider.getVersion();
      const v2 = provider.getVersion();
      expect(v1).toEqual(v2);
      expect(v1).not.toBe(v2);
    });

    it('should clear all data on close', () => {
      const dir = createTempDir();
      writeYaml(dir, 'types.yaml', {
        34: { name: { en: 'Tritanium' }, groupID: 18 },
      });
      const p = SdeDataProvider.fromDirectory(dir);
      expect(p.getType(34)).not.toBeNull();
      p.close();
      expect(p.getType(34)).toBeNull();
      expect(p.getAllEntities('eve_types')).toEqual([]);
      fs.rmSync(dir, { recursive: true, force: true });
    });
  });

  // ---------------------------------------------------------------
  // Domain methods that return null / [] for missing tables
  // ---------------------------------------------------------------

  describe('Empty table returns', () => {
    let emptyProvider: SdeDataProvider;

    beforeAll(() => {
      const dir = createTempDir();
      emptyProvider = SdeDataProvider.fromDirectory(dir);
      fs.rmSync(dir, { recursive: true, force: true });
    });

    afterAll(() => emptyProvider.close());

    it('should return null for all single lookups', () => {
      expect(emptyProvider.getType(1)).toBeNull();
      expect(emptyProvider.getGroup(1)).toBeNull();
      expect(emptyProvider.getCategory(1)).toBeNull();
      expect(emptyProvider.getRegion(1)).toBeNull();
      expect(emptyProvider.getConstellation(1)).toBeNull();
      expect(emptyProvider.getSolarSystem(1)).toBeNull();
      expect(emptyProvider.getStargate(1)).toBeNull();
      expect(emptyProvider.getStar(1)).toBeNull();
      expect(emptyProvider.getStarBySystem(1)).toBeNull();
      expect(emptyProvider.getPlanet(1)).toBeNull();
      expect(emptyProvider.getMoon(1)).toBeNull();
      expect(emptyProvider.getAsteroidBelt(1)).toBeNull();
      expect(emptyProvider.getFaction(1)).toBeNull();
      expect(emptyProvider.getRace(1)).toBeNull();
      expect(emptyProvider.getBloodline(1)).toBeNull();
      expect(emptyProvider.getAncestry(1)).toBeNull();
      expect(emptyProvider.getNpcCorporation(1)).toBeNull();
      expect(emptyProvider.getNpcStation(1)).toBeNull();
      expect(emptyProvider.getMarketGroup(1)).toBeNull();
      expect(emptyProvider.getMetaGroup(1)).toBeNull();
      expect(emptyProvider.getIcon(1)).toBeNull();
      expect(emptyProvider.getGraphic(1)).toBeNull();
      expect(emptyProvider.getDogmaAttribute(1)).toBeNull();
      expect(emptyProvider.getDogmaEffect(1)).toBeNull();
      expect(emptyProvider.getBlueprint(1)).toBeNull();
      expect(emptyProvider.getPlanetSchematic(1)).toBeNull();
      expect(emptyProvider.getAgentType(1)).toBeNull();
      expect(emptyProvider.getAgentInSpace(1)).toBeNull();
      expect(emptyProvider.getCertificate(1)).toBeNull();
      expect(emptyProvider.getCharacterAttribute(1)).toBeNull();
      expect(emptyProvider.getCloneGrade(1)).toBeNull();
      expect(emptyProvider.getCorporationActivity(1)).toBeNull();
      expect(emptyProvider.getNpcCorporationDivision(1)).toBeNull();
      expect(emptyProvider.getDogmaAttributeCategory(1)).toBeNull();
      expect(emptyProvider.getDogmaUnit(1)).toBeNull();
      expect(emptyProvider.getIndustryActivity(1)).toBeNull();
      expect(emptyProvider.getLandmark(1)).toBeNull();
      expect(emptyProvider.getNotificationType(1)).toBeNull();
      expect(emptyProvider.getNpcCharacter(1)).toBeNull();
      expect(emptyProvider.getSchool(1)).toBeNull();
      expect(emptyProvider.getSecondarySun(1)).toBeNull();
      expect(emptyProvider.getSkin(1)).toBeNull();
      expect(emptyProvider.getSkinLicense(1)).toBeNull();
      expect(emptyProvider.getStationOperation(1)).toBeNull();
      expect(emptyProvider.getStationService(1)).toBeNull();
      expect(emptyProvider.getTypeDogma(1)).toBeNull();
      expect(emptyProvider.getTypeMaterial(1)).toBeNull();
      expect(emptyProvider.getTypeBonus(1)).toBeNull();
      expect(emptyProvider.getMission(1)).toBeNull();
      expect(emptyProvider.getDungeon(1)).toBeNull();
      expect(emptyProvider.getEpicArc(1)).toBeNull();
    });

    it('should return empty arrays for all collection lookups', () => {
      expect(emptyProvider.getTypesByGroup(1)).toEqual([]);
      expect(emptyProvider.getGroupsByCategory(1)).toEqual([]);
      expect(emptyProvider.getAllCategories()).toEqual([]);
      expect(emptyProvider.getAllRegions()).toEqual([]);
      expect(emptyProvider.getConstellationsByRegion(1)).toEqual([]);
      expect(emptyProvider.getSolarSystemsByConstellation(1)).toEqual([]);
      expect(emptyProvider.getStargatesBySystem(1)).toEqual([]);
      expect(emptyProvider.getPlanetsBySystem(1)).toEqual([]);
      expect(emptyProvider.getMoonsBySystem(1)).toEqual([]);
      expect(emptyProvider.getAsteroidBeltsBySystem(1)).toEqual([]);
      expect(emptyProvider.getAllFactions()).toEqual([]);
      expect(emptyProvider.getAllRaces()).toEqual([]);
      expect(emptyProvider.getBloodlinesByRace(1)).toEqual([]);
      expect(emptyProvider.getAncestriesByBloodline(1)).toEqual([]);
      expect(emptyProvider.getNpcCorporationsByFaction(1)).toEqual([]);
      expect(emptyProvider.getNpcStationsBySystem(1)).toEqual([]);
      expect(emptyProvider.getNpcStationsByOwner(1)).toEqual([]);
      expect(emptyProvider.getMarketGroupsByParent(1)).toEqual([]);
      expect(emptyProvider.getRootMarketGroups()).toEqual([]);
      expect(emptyProvider.getTypesByMarketGroup(1)).toEqual([]);
      expect(emptyProvider.getAllMetaGroups()).toEqual([]);
      expect(emptyProvider.getAllPlanetSchematics()).toEqual([]);
      expect(emptyProvider.getAllAgentTypes()).toEqual([]);
      expect(emptyProvider.getAgentsInSpaceBySystem(1)).toEqual([]);
      expect(emptyProvider.getAllCertificates()).toEqual([]);
      expect(emptyProvider.getAllCharacterAttributes()).toEqual([]);
      expect(emptyProvider.getAllCloneGrades()).toEqual([]);
      expect(emptyProvider.getAllCorporationActivities()).toEqual([]);
      expect(emptyProvider.getAllNpcCorporationDivisions()).toEqual([]);
      expect(emptyProvider.getAllDogmaAttributeCategories()).toEqual([]);
      expect(emptyProvider.getAllDogmaUnits()).toEqual([]);
      expect(emptyProvider.getAllIndustryActivities()).toEqual([]);
      expect(emptyProvider.getAllLandmarks()).toEqual([]);
      expect(emptyProvider.getNpcCharactersByCorporation(1)).toEqual([]);
      expect(emptyProvider.getAllSchools()).toEqual([]);
      expect(emptyProvider.getSecondarySunsBySystem(1)).toEqual([]);
      expect(emptyProvider.getSkinLicensesBySkin(1)).toEqual([]);
      expect(emptyProvider.getAllStationOperations()).toEqual([]);
      expect(emptyProvider.getAllStationServices()).toEqual([]);
      expect(emptyProvider.getAllEpicArcs()).toEqual([]);
    });

    it('should return empty search results', () => {
      expect(emptyProvider.searchTypesByName('x')).toEqual([]);
      expect(emptyProvider.searchSolarSystemsByName('x')).toEqual([]);
      expect(emptyProvider.searchMarketGroupsByName('x')).toEqual([]);
      expect(emptyProvider.searchDogmaAttributesByName('x')).toEqual([]);
      expect(emptyProvider.searchDogmaEffectsByName('x')).toEqual([]);
      expect(emptyProvider.searchNpcCharactersByName('x')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // Extended domain methods with real data
  // ---------------------------------------------------------------

  describe('Extended domain methods', () => {
    let fullDir: string;
    let fullProvider: SdeDataProvider;

    beforeAll(() => {
      fullDir = createTempDir();

      writeYaml(fullDir, 'agentTypes.yaml', {
        1: { name: { en: 'Non-Agent' } },
      });

      writeYaml(fullDir, 'agentsInSpace.yaml', {
        3009841: { solarSystemID: 30000142, dungeonID: 50001 },
      });

      writeYaml(fullDir, 'certificates.yaml', {
        100: { name: { en: 'Core Competency' } },
      });

      writeYaml(fullDir, 'characterAttributes.yaml', {
        1: { name: { en: 'Perception' } },
      });

      writeYaml(fullDir, 'cloneGrades.yaml', {
        1: { name: { en: 'Alpha Clone' } },
      });

      writeYaml(fullDir, 'corporationActivities.yaml', {
        1: { name: { en: 'Manufacturing' } },
      });

      writeYaml(fullDir, 'npcCorporationDivisions.yaml', {
        1: { name: { en: 'Accounting' } },
      });

      writeYaml(fullDir, 'dogmaAttributeCategories.yaml', {
        1: { name: { en: 'Fitting' } },
      });

      writeYaml(fullDir, 'dogmaUnits.yaml', {
        1: { name: { en: 'Milliseconds' } },
      });

      writeYaml(fullDir, 'industryActivities.yaml', {
        1: { name: { en: 'Manufacturing' } },
      });

      writeYaml(fullDir, 'landmarks.yaml', {
        1: { name: { en: 'Jita 4-4' } },
      });

      writeYaml(fullDir, 'notificationTypes.yaml', {
        1: {
          displayName: 'Alliance War Declared',
          internalName: 'AllianceWarDeclared',
        },
      });

      writeYaml(fullDir, 'npcCharacters.yaml', {
        3004543: { name: { en: 'Aura' }, corporationID: 1000035 },
      });

      writeYaml(fullDir, 'schools.yaml', {
        1: { name: { en: 'School of Applied Knowledge' } },
      });

      writeYaml(fullDir, 'mapSecondarySuns.yaml', {
        999: { solarSystemID: 30000142 },
      });

      writeYaml(fullDir, 'skins.yaml', {
        1001: { name: { en: 'Kador SKIN' } },
      });

      writeYaml(fullDir, 'skinLicenses.yaml', {
        2001: { skinID: 1001 },
      });

      writeYaml(fullDir, 'stationOperations.yaml', {
        1: { description: { en: 'Manufacturing Outpost' }, activityID: 1 },
      });

      writeYaml(fullDir, 'stationServices.yaml', {
        1: { serviceName: { en: 'Reprocessing Plant' } },
      });

      writeYaml(fullDir, 'typeDogma.yaml', {
        34: { attributes: [{ attributeID: 9, value: 300 }] },
      });

      writeYaml(fullDir, 'typeMaterials.yaml', {
        34: { materials: [{ materialTypeID: 34, quantity: 1 }] },
      });

      writeYaml(fullDir, 'typeBonus.yaml', {
        34: { bonuses: [{ bonusText: { en: '+5%' } }] },
      });

      writeYaml(fullDir, 'missions.yaml', {
        1: { name: { en: 'The Blockade' } },
      });

      writeYaml(fullDir, 'dungeons.yaml', {
        1: { name: { en: 'Angel Hideaway' } },
      });

      writeYaml(fullDir, 'epicArcs.yaml', {
        1: { name: { en: 'The Blood-Stained Stars' } },
      });

      fullProvider = SdeDataProvider.fromDirectory(fullDir);
    });

    afterAll(() => {
      fullProvider.close();
      fs.rmSync(fullDir, { recursive: true, force: true });
    });

    it('should get agent type', () => {
      expect(fullProvider.getAgentType(1)?.name).toBe('Non-Agent');
    });

    it('should get all agent types', () => {
      expect(fullProvider.getAllAgentTypes()).toHaveLength(1);
    });

    it('should get agent in space', () => {
      expect(fullProvider.getAgentInSpace(3009841)).not.toBeNull();
    });

    it('should get agents in space by system', () => {
      expect(fullProvider.getAgentsInSpaceBySystem(30000142)).toHaveLength(1);
    });

    it('should get certificate', () => {
      expect(fullProvider.getCertificate(100)?.name).toBe('Core Competency');
    });

    it('should get all certificates', () => {
      expect(fullProvider.getAllCertificates()).toHaveLength(1);
    });

    it('should get character attribute', () => {
      expect(fullProvider.getCharacterAttribute(1)?.name).toBe('Perception');
    });

    it('should get all character attributes', () => {
      expect(fullProvider.getAllCharacterAttributes()).toHaveLength(1);
    });

    it('should get clone grade', () => {
      expect(fullProvider.getCloneGrade(1)?.name).toBe('Alpha Clone');
    });

    it('should get all clone grades', () => {
      expect(fullProvider.getAllCloneGrades()).toHaveLength(1);
    });

    it('should get corporation activity', () => {
      expect(fullProvider.getCorporationActivity(1)?.name).toBe(
        'Manufacturing',
      );
    });

    it('should get all corporation activities', () => {
      expect(fullProvider.getAllCorporationActivities()).toHaveLength(1);
    });

    it('should get NPC corporation division', () => {
      expect(fullProvider.getNpcCorporationDivision(1)?.name).toBe(
        'Accounting',
      );
    });

    it('should get all NPC corporation divisions', () => {
      expect(fullProvider.getAllNpcCorporationDivisions()).toHaveLength(1);
    });

    it('should get dogma attribute category', () => {
      expect(fullProvider.getDogmaAttributeCategory(1)?.name).toBe('Fitting');
    });

    it('should get all dogma attribute categories', () => {
      expect(fullProvider.getAllDogmaAttributeCategories()).toHaveLength(1);
    });

    it('should get dogma unit', () => {
      expect(fullProvider.getDogmaUnit(1)?.name).toBe('Milliseconds');
    });

    it('should get all dogma units', () => {
      expect(fullProvider.getAllDogmaUnits()).toHaveLength(1);
    });

    it('should get industry activity', () => {
      expect(fullProvider.getIndustryActivity(1)?.name).toBe('Manufacturing');
    });

    it('should get all industry activities', () => {
      expect(fullProvider.getAllIndustryActivities()).toHaveLength(1);
    });

    it('should get landmark', () => {
      expect(fullProvider.getLandmark(1)?.name).toBe('Jita 4-4');
    });

    it('should get all landmarks', () => {
      expect(fullProvider.getAllLandmarks()).toHaveLength(1);
    });

    it('should get notification type', () => {
      expect(fullProvider.getNotificationType(1)?.displayName).toBe(
        'Alliance War Declared',
      );
    });

    it('should get NPC character', () => {
      expect(fullProvider.getNpcCharacter(3004543)?.name).toBe('Aura');
    });

    it('should get NPC characters by corporation', () => {
      expect(fullProvider.getNpcCharactersByCorporation(1000035)).toHaveLength(
        1,
      );
    });

    it('should search NPC characters by name', () => {
      expect(fullProvider.searchNpcCharactersByName('aura')).toHaveLength(1);
    });

    it('should get school', () => {
      expect(fullProvider.getSchool(1)?.name).toBe(
        'School of Applied Knowledge',
      );
    });

    it('should get all schools', () => {
      expect(fullProvider.getAllSchools()).toHaveLength(1);
    });

    it('should get secondary sun', () => {
      expect(fullProvider.getSecondarySun(999)).not.toBeNull();
    });

    it('should get secondary suns by system', () => {
      expect(fullProvider.getSecondarySunsBySystem(30000142)).toHaveLength(1);
    });

    it('should get skin', () => {
      expect(fullProvider.getSkin(1001)).not.toBeNull();
    });

    it('should get skin license', () => {
      expect(fullProvider.getSkinLicense(2001)).not.toBeNull();
    });

    it('should get skin licenses by skin', () => {
      expect(fullProvider.getSkinLicensesBySkin(1001)).toHaveLength(1);
    });

    it('should get station operation', () => {
      expect(fullProvider.getStationOperation(1)?.description).toBe(
        'Manufacturing Outpost',
      );
    });

    it('should get all station operations', () => {
      expect(fullProvider.getAllStationOperations()).toHaveLength(1);
    });

    it('should get station service', () => {
      expect(fullProvider.getStationService(1)?.serviceName).toBe(
        'Reprocessing Plant',
      );
    });

    it('should get all station services', () => {
      expect(fullProvider.getAllStationServices()).toHaveLength(1);
    });

    it('should get type dogma', () => {
      expect(fullProvider.getTypeDogma(34)).not.toBeNull();
    });

    it('should get type material', () => {
      expect(fullProvider.getTypeMaterial(34)).not.toBeNull();
    });

    it('should get type bonus', () => {
      expect(fullProvider.getTypeBonus(34)).not.toBeNull();
    });

    it('should get mission', () => {
      expect(fullProvider.getMission(1)?.name).toBe('The Blockade');
    });

    it('should get dungeon', () => {
      expect(fullProvider.getDungeon(1)?.name).toBe('Angel Hideaway');
    });

    it('should get epic arc', () => {
      expect(fullProvider.getEpicArc(1)?.name).toBe('The Blood-Stained Stars');
    });

    it('should get all epic arcs', () => {
      expect(fullProvider.getAllEpicArcs()).toHaveLength(1);
    });
  });
});
