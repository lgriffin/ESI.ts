/**
 * Real SDE data validation tests.
 *
 * These tests load actual CCP SDE YAML data via SdeDataProvider and verify
 * that the provider can query all entity types correctly.
 *
 * The SDE data directory (sde-data/, or SDE_DATA_PATH) is gitignored and
 * must be populated:
 *   npx ts-node scripts/sde/sde-ingest.ts --output sde-data
 *
 * Skips when the data directory does not exist, unless SDE_REQUIRE_DATA=1
 * (nightly-sde.yml sets it), when a missing export fails instead: a nightly
 * that skipped everything would read as green.
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

const SDE_DIR = path.resolve(
  __dirname,
  '../../..',
  process.env.SDE_DATA_PATH ?? 'sde-data',
);
const hasData =
  fs.existsSync(SDE_DIR) && fs.existsSync(path.join(SDE_DIR, 'types.yaml'));
const required = process.env.SDE_REQUIRE_DATA === '1';
const canRun = hasData || required;

/**
 * One lookup per entity family of the README's API reference: the whole
 * table through the generic accessor, then the first record back through the
 * family's own method. A family whose table is empty in the real export, or
 * whose lookup disagrees with the table, fails here before a user finds it.
 */
interface FamilySmoke {
  family: string;
  table: string;
  idField: string;
  lookup: (sde: IStaticDataProvider, id: number) => unknown;
}

const FAMILY_SMOKE: FamilySmoke[] = [
  {
    family: 'Types',
    table: 'eve_types',
    idField: 'typeId',
    lookup: (s, id) => s.getType(id),
  },
  {
    family: 'Types',
    table: 'eve_groups',
    idField: 'groupId',
    lookup: (s, id) => s.getGroup(id),
  },
  {
    family: 'Types',
    table: 'eve_categories',
    idField: 'categoryId',
    lookup: (s, id) => s.getCategory(id),
  },
  {
    family: 'Geography',
    table: 'eve_regions',
    idField: 'regionId',
    lookup: (s, id) => s.getRegion(id),
  },
  {
    family: 'Geography',
    table: 'eve_constellations',
    idField: 'constellationId',
    lookup: (s, id) => s.getConstellation(id),
  },
  {
    family: 'Geography',
    table: 'eve_solar_systems',
    idField: 'systemId',
    lookup: (s, id) => s.getSolarSystem(id),
  },
  {
    family: 'Geography',
    table: 'eve_stargates',
    idField: 'stargateId',
    lookup: (s, id) => s.getStargate(id),
  },
  {
    family: 'Universe',
    table: 'eve_stars',
    idField: 'starId',
    lookup: (s, id) => s.getStar(id),
  },
  {
    family: 'Universe',
    table: 'eve_planets',
    idField: 'planetId',
    lookup: (s, id) => s.getPlanet(id),
  },
  {
    family: 'Universe',
    table: 'eve_moons',
    idField: 'moonId',
    lookup: (s, id) => s.getMoon(id),
  },
  {
    family: 'Universe',
    table: 'eve_asteroid_belts',
    idField: 'asteroidBeltId',
    lookup: (s, id) => s.getAsteroidBelt(id),
  },
  {
    family: 'Character and Lore',
    table: 'eve_factions',
    idField: 'factionId',
    lookup: (s, id) => s.getFaction(id),
  },
  {
    family: 'Character and Lore',
    table: 'eve_races',
    idField: 'raceId',
    lookup: (s, id) => s.getRace(id),
  },
  {
    family: 'Character and Lore',
    table: 'eve_bloodlines',
    idField: 'bloodlineId',
    lookup: (s, id) => s.getBloodline(id),
  },
  {
    family: 'Character and Lore',
    table: 'eve_ancestries',
    idField: 'ancestryId',
    lookup: (s, id) => s.getAncestry(id),
  },
  {
    family: 'NPC Infrastructure',
    table: 'eve_npc_corporations',
    idField: 'corporationId',
    lookup: (s, id) => s.getNpcCorporation(id),
  },
  {
    family: 'NPC Infrastructure',
    table: 'eve_npc_stations',
    idField: 'stationId',
    lookup: (s, id) => s.getNpcStation(id),
  },
  {
    family: 'Market',
    table: 'eve_market_groups',
    idField: 'marketGroupId',
    lookup: (s, id) => s.getMarketGroup(id),
  },
  {
    family: 'Meta and UI',
    table: 'eve_meta_groups',
    idField: 'metaGroupId',
    lookup: (s, id) => s.getMetaGroup(id),
  },
  {
    family: 'Meta and UI',
    table: 'eve_icons',
    idField: 'iconId',
    lookup: (s, id) => s.getIcon(id),
  },
  {
    family: 'Meta and UI',
    table: 'eve_graphics',
    idField: 'graphicId',
    lookup: (s, id) => s.getGraphic(id),
  },
  {
    family: 'Dogma',
    table: 'eve_dogma_attributes',
    idField: 'attributeId',
    lookup: (s, id) => s.getDogmaAttribute(id),
  },
  {
    family: 'Dogma',
    table: 'eve_dogma_effects',
    idField: 'effectId',
    lookup: (s, id) => s.getDogmaEffect(id),
  },
  {
    family: 'Dogma',
    table: 'eve_dogma_attribute_categories',
    idField: 'attributeCategoryId',
    lookup: (s, id) => s.getDogmaAttributeCategory(id),
  },
  {
    family: 'Dogma',
    table: 'eve_dogma_units',
    idField: 'unitId',
    lookup: (s, id) => s.getDogmaUnit(id),
  },
  {
    family: 'Industry',
    table: 'eve_blueprints',
    idField: 'blueprintTypeId',
    lookup: (s, id) => s.getBlueprint(id),
  },
  {
    family: 'Industry',
    table: 'eve_planet_schematics',
    idField: 'planetSchematicId',
    lookup: (s, id) => s.getPlanetSchematic(id),
  },
  {
    family: 'Industry',
    table: 'eve_industry_activities',
    idField: 'industryActivityId',
    lookup: (s, id) => s.getIndustryActivity(id),
  },
  {
    family: 'Agent System',
    table: 'eve_agent_types',
    idField: 'agentTypeId',
    lookup: (s, id) => s.getAgentType(id),
  },
  {
    family: 'Agent System',
    table: 'eve_agents_in_space',
    idField: 'characterId',
    lookup: (s, id) => s.getAgentInSpace(id),
  },
  {
    family: 'Certificates',
    table: 'eve_certificates',
    idField: 'certificateId',
    lookup: (s, id) => s.getCertificate(id),
  },
  {
    family: 'Character',
    table: 'eve_character_attributes',
    idField: 'attributeId',
    lookup: (s, id) => s.getCharacterAttribute(id),
  },
  {
    family: 'NPC Characters',
    table: 'eve_npc_characters',
    idField: 'characterId',
    lookup: (s, id) => s.getNpcCharacter(id),
  },
  {
    family: 'Clone Grades',
    table: 'eve_clone_grades',
    idField: 'cloneGradeId',
    lookup: (s, id) => s.getCloneGrade(id),
  },
  {
    family: 'Corporation Reference',
    table: 'eve_corporation_activities',
    idField: 'corporationActivityId',
    lookup: (s, id) => s.getCorporationActivity(id),
  },
  {
    family: 'Corporation Reference',
    table: 'eve_npc_corporation_divisions',
    idField: 'npcCorporationDivisionId',
    lookup: (s, id) => s.getNpcCorporationDivision(id),
  },
  {
    family: 'Landmarks',
    table: 'eve_landmarks',
    idField: 'landmarkId',
    lookup: (s, id) => s.getLandmark(id),
  },
  {
    family: 'Notifications',
    table: 'eve_notification_types',
    idField: 'notificationTypeId',
    lookup: (s, id) => s.getNotificationType(id),
  },
  {
    family: 'Schools',
    table: 'eve_schools',
    idField: 'schoolId',
    lookup: (s, id) => s.getSchool(id),
  },
  {
    family: 'Secondary Suns',
    table: 'eve_secondary_suns',
    idField: 'secondarySunId',
    lookup: (s, id) => s.getSecondarySun(id),
  },
  {
    family: 'Skins',
    table: 'eve_skins',
    idField: 'skinId',
    lookup: (s, id) => s.getSkin(id),
  },
  {
    family: 'Skins',
    table: 'eve_skin_licenses',
    idField: 'licenseTypeId',
    lookup: (s, id) => s.getSkinLicense(id),
  },
  {
    family: 'Station Operations',
    table: 'eve_station_operations',
    idField: 'stationOperationId',
    lookup: (s, id) => s.getStationOperation(id),
  },
  {
    family: 'Station Operations',
    table: 'eve_station_services',
    idField: 'stationServiceId',
    lookup: (s, id) => s.getStationService(id),
  },
  {
    family: 'Type Extensions',
    table: 'eve_type_dogma',
    idField: 'typeId',
    lookup: (s, id) => s.getTypeDogma(id),
  },
  {
    family: 'Type Extensions',
    table: 'eve_type_materials',
    idField: 'typeId',
    lookup: (s, id) => s.getTypeMaterial(id),
  },
  {
    family: 'Type Extensions',
    table: 'eve_type_bonuses',
    idField: 'typeId',
    lookup: (s, id) => s.getTypeBonus(id),
  },
  {
    family: 'Missions and Content',
    table: 'eve_missions',
    idField: 'missionId',
    lookup: (s, id) => s.getMission(id),
  },
  {
    family: 'Missions and Content',
    table: 'eve_dungeons',
    idField: 'dungeonId',
    lookup: (s, id) => s.getDungeon(id),
  },
  {
    family: 'Missions and Content',
    table: 'eve_epic_arcs',
    idField: 'epicArcId',
    lookup: (s, id) => s.getEpicArc(id),
  },
];

(canRun ? describe : describe.skip)('Real SDE data validation', () => {
  let sde: IStaticDataProvider;

  beforeAll(() => {
    if (!hasData) {
      throw new Error(
        `SDE_REQUIRE_DATA=1 but no export at ${SDE_DIR}; run npm run sde:ingest first.`,
      );
    }
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
        expect(g.parentGroupId == null).toBe(true);
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
      expect(noName).toHaveLength(0);
    });

    it('solar systems should have valid security status', () => {
      const systems = sde.getAllEntities<SolarSystem>('eve_solar_systems');
      const invalid = systems.filter(
        (s) => s.securityStatus < -1.1 || s.securityStatus > 1.1,
      );
      expect(invalid).toHaveLength(0);
    });

    it('market groups should form a valid tree', () => {
      const groups = sde.getAllEntities<MarketGroup>('eve_market_groups');
      const ids = new Set(groups.map((g) => g.marketGroupId));
      const orphans = groups.filter(
        (g) => g.parentGroupId != null && !ids.has(g.parentGroupId),
      );
      expect(orphans).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // One lookup per family
  // ---------------------------------------------------------------

  describe('every family answers from the real export', () => {
    for (const { family, table, idField, lookup } of FAMILY_SMOKE) {
      it(`${family}: ${table} is populated and its lookup returns the first record`, () => {
        const all = sde.getAllEntities<Record<string, unknown>>(table);
        expect(all.length).toBeGreaterThan(0);
        const first = all[0]!;
        const id = first[idField];
        expect(typeof id).toBe('number');
        expect(lookup(sde, id as number)).toEqual(first);
        expect(sde.getEntity(table, id as number)).toEqual(first);
      });
    }

    it('covers a table for every family in the API reference', () => {
      const families = new Set(FAMILY_SMOKE.map((f) => f.family));
      expect(families.size).toBeGreaterThanOrEqual(19);
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
