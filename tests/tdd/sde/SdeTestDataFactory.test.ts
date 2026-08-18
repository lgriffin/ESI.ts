import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
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
  SdeVersionSchema,
} from '../../../src/sde/schemas';

describe('SdeTestDataFactory', () => {
  describe('createEveType', () => {
    it('should return valid defaults', () => {
      const type = SdeTestDataFactory.createEveType();
      expect(() => EveTypeSchema.parse(type)).not.toThrow();
      expect(type.typeId).toBe(34);
      expect(type.name).toBe('Tritanium');
    });

    it('should accept overrides', () => {
      const type = SdeTestDataFactory.createEveType({
        typeId: 35,
        name: 'Pyerite',
      });
      expect(type.typeId).toBe(35);
      expect(type.name).toBe('Pyerite');
      expect(type.groupId).toBe(18);
    });
  });

  describe('createEveGroup', () => {
    it('should return valid defaults', () => {
      const group = SdeTestDataFactory.createEveGroup();
      expect(() => EveGroupSchema.parse(group)).not.toThrow();
      expect(group.groupId).toBe(18);
      expect(group.name).toBe('Mineral');
    });

    it('should accept overrides', () => {
      const group = SdeTestDataFactory.createEveGroup({
        groupId: 19,
        name: 'Ore',
      });
      expect(group.groupId).toBe(19);
      expect(group.name).toBe('Ore');
    });
  });

  describe('createEveCategory', () => {
    it('should return valid defaults', () => {
      const category = SdeTestDataFactory.createEveCategory();
      expect(() => EveCategorySchema.parse(category)).not.toThrow();
      expect(category.categoryId).toBe(4);
      expect(category.name).toBe('Material');
    });

    it('should accept overrides', () => {
      const category = SdeTestDataFactory.createEveCategory({ name: 'Ship' });
      expect(category.name).toBe('Ship');
    });
  });

  describe('createRegion', () => {
    it('should return valid defaults', () => {
      const region = SdeTestDataFactory.createRegion();
      expect(() => RegionSchema.parse(region)).not.toThrow();
      expect(region.regionId).toBe(10000002);
      expect(region.name).toBe('The Forge');
    });

    it('should accept overrides', () => {
      const region = SdeTestDataFactory.createRegion({ name: 'Domain' });
      expect(region.name).toBe('Domain');
    });
  });

  describe('createConstellation', () => {
    it('should return valid defaults', () => {
      const constellation = SdeTestDataFactory.createConstellation();
      expect(() => ConstellationSchema.parse(constellation)).not.toThrow();
      expect(constellation.constellationId).toBe(20000020);
      expect(constellation.name).toBe('Kimotoro');
    });

    it('should accept overrides', () => {
      const constellation = SdeTestDataFactory.createConstellation({
        name: 'Lonetrek',
      });
      expect(constellation.name).toBe('Lonetrek');
    });
  });

  describe('createSolarSystem', () => {
    it('should return valid defaults', () => {
      const system = SdeTestDataFactory.createSolarSystem();
      expect(() => SolarSystemSchema.parse(system)).not.toThrow();
      expect(system.systemId).toBe(30000142);
      expect(system.name).toBe('Jita');
    });

    it('should accept overrides', () => {
      const system = SdeTestDataFactory.createSolarSystem({
        name: 'Amarr',
        securityStatus: 1.0,
      });
      expect(system.name).toBe('Amarr');
      expect(system.securityStatus).toBe(1.0);
    });
  });

  describe('createStargate', () => {
    it('should return valid defaults', () => {
      const stargate = SdeTestDataFactory.createStargate();
      expect(() => StargateSchema.parse(stargate)).not.toThrow();
      expect(stargate.stargateId).toBe(50001248);
    });

    it('should accept overrides', () => {
      const stargate = SdeTestDataFactory.createStargate({ stargateId: 99999 });
      expect(stargate.stargateId).toBe(99999);
    });
  });

  describe('createStar', () => {
    it('should return valid defaults', () => {
      const star = SdeTestDataFactory.createStar();
      expect(() => StarSchema.parse(star)).not.toThrow();
      expect(star.starId).toBe(40009082);
      expect(star.name).toBe('Jita - Star');
    });

    it('should accept overrides', () => {
      const star = SdeTestDataFactory.createStar({ name: 'Amarr - Star' });
      expect(star.name).toBe('Amarr - Star');
    });
  });

  describe('createPlanet', () => {
    it('should return valid defaults', () => {
      const planet = SdeTestDataFactory.createPlanet();
      expect(() => PlanetSchema.parse(planet)).not.toThrow();
      expect(planet.planetId).toBe(40009077);
      expect(planet.name).toBe('Jita I');
    });

    it('should accept overrides', () => {
      const planet = SdeTestDataFactory.createPlanet({ name: 'Jita II' });
      expect(planet.name).toBe('Jita II');
    });
  });

  describe('createMoon', () => {
    it('should return valid defaults', () => {
      const moon = SdeTestDataFactory.createMoon();
      expect(() => MoonSchema.parse(moon)).not.toThrow();
      expect(moon.moonId).toBe(40009078);
      expect(moon.name).toBe('Jita I - Moon 1');
    });

    it('should accept overrides', () => {
      const moon = SdeTestDataFactory.createMoon({ name: 'Jita I - Moon 2' });
      expect(moon.name).toBe('Jita I - Moon 2');
    });
  });

  describe('createAsteroidBelt', () => {
    it('should return valid defaults', () => {
      const belt = SdeTestDataFactory.createAsteroidBelt();
      expect(() => AsteroidBeltSchema.parse(belt)).not.toThrow();
      expect(belt.asteroidBeltId).toBe(40009079);
      expect(belt.name).toBe('Jita I - Asteroid Belt 1');
    });

    it('should accept overrides', () => {
      const belt = SdeTestDataFactory.createAsteroidBelt({
        name: 'Jita II - Asteroid Belt 1',
      });
      expect(belt.name).toBe('Jita II - Asteroid Belt 1');
    });
  });

  describe('createFaction', () => {
    it('should return valid defaults', () => {
      const faction = SdeTestDataFactory.createFaction();
      expect(() => FactionSchema.parse(faction)).not.toThrow();
      expect(faction.factionId).toBe(500001);
      expect(faction.name).toBe('Caldari State');
    });

    it('should accept overrides', () => {
      const faction = SdeTestDataFactory.createFaction({
        name: 'Gallente Federation',
      });
      expect(faction.name).toBe('Gallente Federation');
    });
  });

  describe('createRace', () => {
    it('should return valid defaults', () => {
      const race = SdeTestDataFactory.createRace();
      expect(() => RaceSchema.parse(race)).not.toThrow();
      expect(race.raceId).toBe(1);
      expect(race.name).toBe('Caldari');
    });

    it('should accept overrides', () => {
      const race = SdeTestDataFactory.createRace({ name: 'Gallente' });
      expect(race.name).toBe('Gallente');
    });
  });

  describe('createBloodline', () => {
    it('should return valid defaults', () => {
      const bloodline = SdeTestDataFactory.createBloodline();
      expect(() => BloodlineSchema.parse(bloodline)).not.toThrow();
      expect(bloodline.bloodlineId).toBe(1);
      expect(bloodline.name).toBe('Deteis');
    });

    it('should accept overrides', () => {
      const bloodline = SdeTestDataFactory.createBloodline({
        name: 'Civire',
      });
      expect(bloodline.name).toBe('Civire');
    });
  });

  describe('createAncestry', () => {
    it('should return valid defaults', () => {
      const ancestry = SdeTestDataFactory.createAncestry();
      expect(() => AncestrySchema.parse(ancestry)).not.toThrow();
      expect(ancestry.ancestryId).toBe(1);
      expect(ancestry.name).toBe('Tube Child');
    });

    it('should accept overrides', () => {
      const ancestry = SdeTestDataFactory.createAncestry({
        name: 'Shopkeeper',
      });
      expect(ancestry.name).toBe('Shopkeeper');
    });
  });

  describe('createNpcCorporation', () => {
    it('should return valid defaults', () => {
      const corp = SdeTestDataFactory.createNpcCorporation();
      expect(() => NpcCorporationSchema.parse(corp)).not.toThrow();
      expect(corp.corporationId).toBe(1000035);
      expect(corp.name).toBe('Caldari Navy');
    });

    it('should accept overrides', () => {
      const corp = SdeTestDataFactory.createNpcCorporation({
        name: 'Caldari Provisions',
      });
      expect(corp.name).toBe('Caldari Provisions');
    });
  });

  describe('createNpcStation', () => {
    it('should return valid defaults', () => {
      const station = SdeTestDataFactory.createNpcStation();
      expect(() => NpcStationSchema.parse(station)).not.toThrow();
      expect(station.stationId).toBe(60003760);
      expect(station.name).toBe(
        'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      );
    });

    it('should accept overrides', () => {
      const station = SdeTestDataFactory.createNpcStation({
        name: 'Amarr Trade Hub',
      });
      expect(station.name).toBe('Amarr Trade Hub');
    });
  });

  describe('createMarketGroup', () => {
    it('should return valid defaults', () => {
      const group = SdeTestDataFactory.createMarketGroup();
      expect(() => MarketGroupSchema.parse(group)).not.toThrow();
      expect(group.marketGroupId).toBe(1857);
      expect(group.name).toBe('Minerals');
    });

    it('should accept overrides', () => {
      const group = SdeTestDataFactory.createMarketGroup({ name: 'Ores' });
      expect(group.name).toBe('Ores');
    });
  });

  describe('createMetaGroup', () => {
    it('should return valid defaults', () => {
      const group = SdeTestDataFactory.createMetaGroup();
      expect(() => MetaGroupSchema.parse(group)).not.toThrow();
      expect(group.metaGroupId).toBe(1);
      expect(group.name).toBe('Tech I');
    });

    it('should accept overrides', () => {
      const group = SdeTestDataFactory.createMetaGroup({ name: 'Tech II' });
      expect(group.name).toBe('Tech II');
    });
  });

  describe('createIcon', () => {
    it('should return valid defaults', () => {
      const icon = SdeTestDataFactory.createIcon();
      expect(() => IconSchema.parse(icon)).not.toThrow();
      expect(icon.iconId).toBe(22);
      expect(icon.iconFile).toBe('res:/UI/Texture/Icons/22_32_2.png');
    });

    it('should accept overrides', () => {
      const icon = SdeTestDataFactory.createIcon({ iconId: 99 });
      expect(icon.iconId).toBe(99);
    });
  });

  describe('createGraphic', () => {
    it('should return valid defaults', () => {
      const graphic = SdeTestDataFactory.createGraphic();
      expect(() => GraphicSchema.parse(graphic)).not.toThrow();
      expect(graphic.graphicId).toBe(20);
    });

    it('should accept overrides', () => {
      const graphic = SdeTestDataFactory.createGraphic({ graphicId: 99 });
      expect(graphic.graphicId).toBe(99);
    });
  });

  describe('createDogmaAttribute', () => {
    it('should return valid defaults', () => {
      const attr = SdeTestDataFactory.createDogmaAttribute();
      expect(() => DogmaAttributeSchema.parse(attr)).not.toThrow();
      expect(attr.attributeId).toBe(9);
      expect(attr.name).toBe('hp');
    });

    it('should accept overrides', () => {
      const attr = SdeTestDataFactory.createDogmaAttribute({
        name: 'shieldCapacity',
      });
      expect(attr.name).toBe('shieldCapacity');
    });
  });

  describe('createDogmaEffect', () => {
    it('should return valid defaults', () => {
      const effect = SdeTestDataFactory.createDogmaEffect();
      expect(() => DogmaEffectSchema.parse(effect)).not.toThrow();
      expect(effect.effectId).toBe(11);
      expect(effect.name).toBe('lowSlotModifier');
    });

    it('should accept overrides', () => {
      const effect = SdeTestDataFactory.createDogmaEffect({
        name: 'highSlotModifier',
      });
      expect(effect.name).toBe('highSlotModifier');
    });
  });

  describe('createBlueprint', () => {
    it('should return valid defaults', () => {
      const bp = SdeTestDataFactory.createBlueprint();
      expect(() => BlueprintSchema.parse(bp)).not.toThrow();
      expect(bp.blueprintTypeId).toBe(787);
      expect(bp.manufacturing).not.toBeNull();
    });

    it('should accept overrides', () => {
      const bp = SdeTestDataFactory.createBlueprint({
        maxProductionLimit: 20,
      });
      expect(bp.maxProductionLimit).toBe(20);
    });
  });

  describe('createPlanetSchematic', () => {
    it('should return valid defaults', () => {
      const schematic = SdeTestDataFactory.createPlanetSchematic();
      expect(() => PlanetSchematicSchema.parse(schematic)).not.toThrow();
      expect(schematic.planetSchematicId).toBe(65);
      expect(schematic.name).toBe('Bacteria');
    });

    it('should accept overrides', () => {
      const schematic = SdeTestDataFactory.createPlanetSchematic({
        name: 'Reactive Metals',
      });
      expect(schematic.name).toBe('Reactive Metals');
    });
  });

  describe('createVersionInfo', () => {
    it('should return valid defaults', () => {
      const version = SdeTestDataFactory.createVersionInfo();
      expect(() => SdeVersionSchema.parse(version)).not.toThrow();
      expect(version.version).toBe('2024-01-15.1');
    });

    it('should accept overrides', () => {
      const version = SdeTestDataFactory.createVersionInfo({
        version: '2025-01-01.1',
      });
      expect(version.version).toBe('2025-01-01.1');
    });
  });

  describe('createHierarchicalTestData', () => {
    it('should return a complete related dataset', () => {
      const data = SdeTestDataFactory.createHierarchicalTestData();
      expect(data.categories).toHaveLength(1);
      expect(data.groups).toHaveLength(1);
      expect(data.types).toHaveLength(3);
      expect(data.regions).toHaveLength(1);
      expect(data.constellations).toHaveLength(1);
      expect(data.solarSystems).toHaveLength(2);
      expect(data.stargates).toHaveLength(1);
      expect(data.version).toBeDefined();
    });

    it('should include all new entity arrays', () => {
      const data = SdeTestDataFactory.createHierarchicalTestData();
      expect(data.stars).toHaveLength(1);
      expect(data.planets).toHaveLength(1);
      expect(data.moons).toHaveLength(1);
      expect(data.asteroidBelts).toHaveLength(1);
      expect(data.factions).toHaveLength(1);
      expect(data.races).toHaveLength(1);
      expect(data.bloodlines).toHaveLength(1);
      expect(data.ancestries).toHaveLength(1);
      expect(data.npcCorporations).toHaveLength(1);
      expect(data.npcStations).toHaveLength(1);
      expect(data.marketGroups).toHaveLength(2);
      expect(data.metaGroups).toHaveLength(1);
      expect(data.icons).toHaveLength(1);
      expect(data.graphics).toHaveLength(1);
      expect(data.dogmaAttributes).toHaveLength(1);
      expect(data.dogmaEffects).toHaveLength(1);
      expect(data.blueprints).toHaveLength(1);
      expect(data.planetSchematics).toHaveLength(1);
    });

    it('should have consistent foreign key relationships', () => {
      const data = SdeTestDataFactory.createHierarchicalTestData();
      const group = data.groups![0]!;
      const category = data.categories![0]!;
      expect(group.categoryId).toBe(category.categoryId);

      for (const type of data.types!) {
        expect(type.groupId).toBe(group.groupId);
      }

      const region = data.regions![0]!;
      const constellation = data.constellations![0]!;
      expect(constellation.regionId).toBe(region.regionId);

      for (const system of data.solarSystems!) {
        expect(system.constellationId).toBe(constellation.constellationId);
        expect(system.regionId).toBe(region.regionId);
      }
    });

    it('should have consistent FK relationships for new entities', () => {
      const data = SdeTestDataFactory.createHierarchicalTestData();
      const system = data.solarSystems![0]!;
      const planet = data.planets![0]!;
      const race = data.races![0]!;
      const bloodline = data.bloodlines![0]!;

      // Star -> SolarSystem
      expect(data.stars![0]!.solarSystemId).toBe(system.systemId);

      // Moon -> Planet
      expect(data.moons![0]!.planetId).toBe(planet.planetId);

      // Bloodline -> Race
      expect(bloodline.raceId).toBe(race.raceId);

      // Ancestry -> Bloodline
      expect(data.ancestries![0]!.bloodlineId).toBe(bloodline.bloodlineId);

      // NpcCorporation -> Faction
      expect(data.npcCorporations![0]!.factionId).toBe(
        data.factions![0]!.factionId,
      );

      // NpcStation -> SolarSystem, Corporation
      const station = data.npcStations![0]!;
      expect(station.solarSystemId).toBe(system.systemId);
      expect(station.corporationId).toBe(
        data.npcCorporations![0]!.corporationId,
      );

      // MarketGroup child -> parent
      const childGroup = data.marketGroups!.find(
        (g) => g.parentGroupId !== null,
      )!;
      const parentGroup = data.marketGroups!.find(
        (g) => g.parentGroupId === null,
      )!;
      expect(childGroup.parentGroupId).toBe(parentGroup.marketGroupId);
    });
  });
});
