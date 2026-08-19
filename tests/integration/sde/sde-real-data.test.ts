/**
 * Real SDE data validation tests.
 *
 * These tests load actual CCP SDE YAML data via SdeDataProvider and verify
 * that the provider can query all entity types correctly.
 *
 * The SDE data directory (sde-data/) is gitignored and must be populated:
 *   npx ts-node scripts/sde-ingest.ts --output sde-data
 *
 * Skip automatically when the data directory does not exist.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SdeDataProvider } from '../../../src/sde/SdeDataProvider';
import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';
import type {
  EveType,
  EveGroup,
  Constellation,
  SolarSystem,
  Bloodline,
  Ancestry,
  MarketGroup,
  Skin,
} from '../../../src/sde/types';

const SDE_DIR = path.resolve(__dirname, '../../../sde-data');
const canRun =
  fs.existsSync(SDE_DIR) && fs.existsSync(path.join(SDE_DIR, 'types.yaml'));

(canRun ? describe : describe.skip)('Real SDE data validation', () => {
  let sde: IStaticDataProvider;

  beforeAll(() => {
    sde = SdeDataProvider.fromDirectory(SDE_DIR);
  }, 300000);

  afterAll(() => {
    sde?.close();
  });

  // ---------------------------------------------------------------
  // Well-known entity lookups
  // ---------------------------------------------------------------

  describe('well-known entities', () => {
    it('Tritanium (type 34) should exist with correct name', () => {
      const row = sde.getType(34);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Tritanium');
      expect(row!.groupId).toBe(18);
      expect(row!.published).toBe(true);
    });

    it('Jita (system 30000142) should exist', () => {
      const row = sde.getSolarSystem(30000142);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Jita');
      expect(row!.securityStatus).toBeGreaterThan(0.9);
    });

    it('The Forge (region 10000002) should exist', () => {
      const row = sde.getRegion(10000002);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('The Forge');
    });

    it('Caldari State (faction 500001) should exist', () => {
      const row = sde.getFaction(500001);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Caldari State');
      expect(row!.memberRaces).toContain(1);
    });

    it('Caldari (race 1) should exist', () => {
      const row = sde.getRace(1);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Caldari');
    });

    it('Minerals (market group 1857) should exist', () => {
      const row = sde.getMarketGroup(1857);
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Minerals');
    });

    it('hp dogma attribute should exist', () => {
      const results = sde.searchDogmaAttributesByName('hp', 5);
      const hp = results.find((a) => a.name === 'hp');
      expect(hp).toBeDefined();
      expect(hp!.highIsGood).toBe(true);
      expect(hp!.published).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Row count sanity checks
  // ---------------------------------------------------------------

  describe('minimum row counts', () => {
    const expectations: [string, string, number][] = [
      ['eve_types', 'types', 40000],
      ['eve_groups', 'groups', 1000],
      ['eve_categories', 'categories', 30],
      ['eve_regions', 'regions', 100],
      ['eve_constellations', 'constellations', 1000],
      ['eve_solar_systems', 'solar systems', 5000],
      ['eve_stargates', 'stargates', 10000],
      ['eve_stars', 'stars', 5000],
      ['eve_planets', 'planets', 50000],
      ['eve_moons', 'moons', 200000],
      ['eve_asteroid_belts', 'asteroid belts', 30000],
      ['eve_factions', 'factions', 10],
      ['eve_races', 'races', 4],
      ['eve_bloodlines', 'bloodlines', 10],
      ['eve_ancestries', 'ancestries', 20],
      ['eve_npc_corporations', 'NPC corporations', 100],
      ['eve_npc_stations', 'NPC stations', 3000],
      ['eve_npc_characters', 'NPC characters', 5000],
      ['eve_market_groups', 'market groups', 1500],
      ['eve_meta_groups', 'meta groups', 5],
      ['eve_icons', 'icons', 3000],
      ['eve_graphics', 'graphics', 4000],
      ['eve_dogma_attributes', 'dogma attributes', 2000],
      ['eve_dogma_effects', 'dogma effects', 2000],
      ['eve_blueprints', 'blueprints', 3000],
      ['eve_skins', 'skins', 5000],
      ['eve_skin_licenses', 'skin licenses', 8000],
      ['eve_certificates', 'certificates', 100],
      ['eve_missions', 'missions', 1000],
      ['eve_dungeons', 'dungeons', 500],
    ];

    for (const [table, label, minRows] of expectations) {
      it(`${label} should have >= ${minRows} entries`, () => {
        const all = sde.getAllEntities(table);
        expect(all.length).toBeGreaterThanOrEqual(minRows);
      });
    }
  });

  // ---------------------------------------------------------------
  // Universe hierarchy
  // ---------------------------------------------------------------

  describe('universe hierarchy', () => {
    it('Jita star should be findable by system', () => {
      const star = sde.getStarBySystem(30000142);
      expect(star).not.toBeNull();
      expect(star!.typeId).toBeGreaterThan(0);
      expect(star!.statistics).toBeDefined();
    });

    it('Jita should have planets', () => {
      const planets = sde.getPlanetsBySystem(30000142);
      expect(planets.length).toBeGreaterThan(0);
      expect(planets[0].typeId).toBeGreaterThan(0);
    });

    it('Jita should have moons', () => {
      const moons = sde.getMoonsBySystem(30000142);
      expect(moons.length).toBeGreaterThan(0);
    });

    it('Jita should have stargates', () => {
      const gates = sde.getStargatesBySystem(30000142);
      expect(gates.length).toBeGreaterThan(0);
      expect(gates[0].destination).toBeDefined();
      expect(gates[0].destination.solarSystemId).toBeGreaterThan(0);
    });

    it('stargates should have destination objects', () => {
      const gates = sde.getStargatesBySystem(30000142);
      for (const gate of gates) {
        expect(gate.destination).toHaveProperty('solarSystemId');
        expect(gate.destination).toHaveProperty('stargateId');
      }
    });

    it('star statistics should have luminosity and spectralClass', () => {
      const star = sde.getStarBySystem(30000142);
      expect(star).not.toBeNull();
      expect(star!.statistics).toHaveProperty('luminosity');
      expect(star!.statistics).toHaveProperty('spectralClass');
    });
  });

  // ---------------------------------------------------------------
  // Cross-entity referential integrity
  // ---------------------------------------------------------------

  describe('referential integrity', () => {
    it('published types should reference valid groups', () => {
      const types = sde
        .getAllEntities<EveType>('eve_types')
        .filter((t) => t.published === true);
      const sample = types.slice(0, 100);
      for (const t of sample) {
        const group = sde.getGroup(t.groupId);
        expect(group).not.toBeNull();
      }
    });

    it('all groups should reference valid categories', () => {
      const groups = sde.getAllEntities<EveGroup>('eve_groups');
      for (const g of groups) {
        const cat = sde.getCategory(g.categoryId);
        expect(cat).not.toBeNull();
      }
    });

    it('constellations should reference valid regions', () => {
      const constellations = sde
        .getAllEntities<Constellation>('eve_constellations')
        .slice(0, 50);
      for (const c of constellations) {
        const region = sde.getRegion(c.regionId);
        expect(region).not.toBeNull();
      }
    });

    it('bloodlines should reference valid races', () => {
      const bloodlines = sde.getAllEntities<Bloodline>('eve_bloodlines');
      for (const b of bloodlines) {
        const race = sde.getRace(b.raceId);
        expect(race).not.toBeNull();
      }
    });

    it('ancestries should reference valid bloodlines', () => {
      const ancestries = sde.getAllEntities<Ancestry>('eve_ancestries');
      for (const a of ancestries) {
        const bl = sde.getBloodline(a.bloodlineId);
        expect(bl).not.toBeNull();
      }
    });
  });

  // ---------------------------------------------------------------
  // FK query methods
  // ---------------------------------------------------------------

  describe('FK queries', () => {
    it('getTypesByGroup returns minerals', () => {
      const minerals = sde.getTypesByGroup(18);
      expect(minerals.length).toBeGreaterThan(0);
      const names = minerals.map((t) => t.name);
      expect(names).toContain('Tritanium');
    });

    it('getConstellationsByRegion returns constellations in The Forge', () => {
      const constellations = sde.getConstellationsByRegion(10000002);
      expect(constellations.length).toBeGreaterThan(0);
    });

    it('getSolarSystemsByConstellation returns systems in Kimotoro', () => {
      const systems = sde.getSolarSystemsByConstellation(20000020);
      expect(systems.length).toBeGreaterThan(0);
      const names = systems.map((s) => s.name);
      expect(names).toContain('Jita');
    });

    it('getBloodlinesByRace returns Caldari bloodlines', () => {
      const bloodlines = sde.getBloodlinesByRace(1);
      expect(bloodlines.length).toBeGreaterThan(0);
    });

    it('getNpcCorporationsByFaction returns Caldari corps', () => {
      const corps = sde.getNpcCorporationsByFaction(500001);
      expect(corps.length).toBeGreaterThan(0);
    });

    it('getRootMarketGroups returns top-level groups', () => {
      const roots = sde.getRootMarketGroups();
      expect(roots.length).toBeGreaterThan(0);
      for (const g of roots) {
        expect(g.parentGroupId).toBeNull();
      }
    });

    it('getSkinLicensesBySkin returns licenses', () => {
      const skins = sde.getAllEntities<Skin>('eve_skins');
      if (skins.length > 0) {
        const licenses = sde.getSkinLicensesBySkin(skins[0].skinId);
        expect(Array.isArray(licenses)).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------

  describe('search', () => {
    it('searchTypesByName finds Tritanium', () => {
      const results = sde.searchTypesByName('Tritanium');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Tritanium');
    });

    it('searchSolarSystemsByName finds Jita', () => {
      const results = sde.searchSolarSystemsByName('Jita');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Jita');
    });

    it('searchMarketGroupsByName finds Minerals', () => {
      const results = sde.searchMarketGroupsByName('Minerals');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // Blueprint activities
  // ---------------------------------------------------------------

  describe('blueprints', () => {
    it('blueprint 681 should have manufacturing activity', () => {
      const bp = sde.getBlueprint(681);
      if (bp) {
        expect(bp.activities).toBeDefined();
        expect(bp.activities.manufacturing).toBeDefined();
        expect(bp.activities.manufacturing!.time).toBeGreaterThan(0);
      }
    });
  });

  // ---------------------------------------------------------------
  // Data quality
  // ---------------------------------------------------------------

  describe('data quality', () => {
    it('published types should have names', () => {
      const types = sde
        .getAllEntities<EveType>('eve_types')
        .filter((t) => t.published === true);
      const noName = types.filter((t) => !t.name || t.name === '');
      expect(noName.length).toBe(0);
    });

    it('solar systems should have valid security status', () => {
      const systems = sde.getAllEntities<SolarSystem>('eve_solar_systems');
      const invalid = systems.filter(
        (s) => s.securityStatus < -1.1 || s.securityStatus > 1.1,
      );
      expect(invalid.length).toBe(0);
    });

    it('market groups should form a valid tree', () => {
      const groups = sde.getAllEntities<MarketGroup>('eve_market_groups');
      const ids = new Set(groups.map((g) => g.marketGroupId));
      const orphans = groups.filter(
        (g) => g.parentGroupId != null && !ids.has(g.parentGroupId),
      );
      expect(orphans.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // Version
  // ---------------------------------------------------------------

  describe('version', () => {
    it('should report SDE version info', () => {
      const version = sde.getVersion();
      expect(version).toBeDefined();
      expect(version.version).toBeDefined();
      expect(version.importedAt).toBeDefined();
    });
  });
});
