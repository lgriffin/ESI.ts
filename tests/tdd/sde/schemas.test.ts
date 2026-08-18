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
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';

describe('SDE Zod Schemas', () => {
  describe('EveTypeSchema', () => {
    it('should accept valid EveType data', () => {
      const data = SdeTestDataFactory.createEveType();
      const result = EveTypeSchema.parse(data);
      expect(result.typeId).toBe(34);
      expect(result.name).toBe('Tritanium');
      expect(result.published).toBe(true);
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createEveType({
        mass: null,
        volume: null,
        capacity: null,
        marketGroupId: null,
        iconId: null,
        graphicId: null,
      });
      const result = EveTypeSchema.parse(data);
      expect(result.mass).toBeNull();
      expect(result.volume).toBeNull();
      expect(result.marketGroupId).toBeNull();
    });

    it('should preserve extra fields (looseObject)', () => {
      const data = {
        ...SdeTestDataFactory.createEveType(),
        extraField: 'test',
      };
      const result = EveTypeSchema.parse(data);
      expect((result as Record<string, unknown>).extraField).toBe('test');
    });

    it('should reject missing required fields', () => {
      expect(() => EveTypeSchema.parse({ typeId: 34 })).toThrow();
    });

    it('should reject wrong field types', () => {
      const data = {
        ...SdeTestDataFactory.createEveType(),
        typeId: 'not-a-number',
      };
      expect(() => EveTypeSchema.parse(data)).toThrow();
    });

    it('should reject non-integer typeId', () => {
      const data = SdeTestDataFactory.createEveType({ typeId: 34.5 });
      expect(() => EveTypeSchema.parse(data)).toThrow();
    });
  });

  describe('EveGroupSchema', () => {
    it('should accept valid EveGroup data', () => {
      const data = SdeTestDataFactory.createEveGroup();
      const result = EveGroupSchema.parse(data);
      expect(result.groupId).toBe(18);
      expect(result.name).toBe('Mineral');
    });

    it('should reject missing required fields', () => {
      expect(() => EveGroupSchema.parse({ groupId: 18 })).toThrow();
    });
  });

  describe('EveCategorySchema', () => {
    it('should accept valid EveCategory data', () => {
      const data = SdeTestDataFactory.createEveCategory();
      const result = EveCategorySchema.parse(data);
      expect(result.categoryId).toBe(4);
      expect(result.name).toBe('Material');
    });

    it('should reject missing required fields', () => {
      expect(() => EveCategorySchema.parse({ categoryId: 4 })).toThrow();
    });
  });

  describe('RegionSchema', () => {
    it('should accept valid Region data', () => {
      const data = SdeTestDataFactory.createRegion();
      const result = RegionSchema.parse(data);
      expect(result.regionId).toBe(10000002);
      expect(result.name).toBe('The Forge');
    });

    it('should accept null description', () => {
      const data = SdeTestDataFactory.createRegion({ description: null });
      const result = RegionSchema.parse(data);
      expect(result.description).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => RegionSchema.parse({ regionId: 10000002 })).toThrow();
    });
  });

  describe('ConstellationSchema', () => {
    it('should accept valid Constellation data', () => {
      const data = SdeTestDataFactory.createConstellation();
      const result = ConstellationSchema.parse(data);
      expect(result.constellationId).toBe(20000020);
      expect(result.name).toBe('Kimotoro');
    });

    it('should reject missing required fields', () => {
      expect(() =>
        ConstellationSchema.parse({ constellationId: 20000020 }),
      ).toThrow();
    });
  });

  describe('SolarSystemSchema', () => {
    it('should accept valid SolarSystem data', () => {
      const data = SdeTestDataFactory.createSolarSystem();
      const result = SolarSystemSchema.parse(data);
      expect(result.systemId).toBe(30000142);
      expect(result.name).toBe('Jita');
      expect(result.securityStatus).toBeCloseTo(0.946);
    });

    it('should accept null securityClass', () => {
      const data = SdeTestDataFactory.createSolarSystem({
        securityClass: null,
      });
      const result = SolarSystemSchema.parse(data);
      expect(result.securityClass).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => SolarSystemSchema.parse({ systemId: 30000142 })).toThrow();
    });
  });

  describe('StargateSchema', () => {
    it('should accept valid Stargate data', () => {
      const data = SdeTestDataFactory.createStargate();
      const result = StargateSchema.parse(data);
      expect(result.stargateId).toBe(50001248);
      expect(result.destinationSystemId).toBe(30000144);
    });

    it('should reject missing required fields', () => {
      expect(() => StargateSchema.parse({ stargateId: 50001248 })).toThrow();
    });
  });

  describe('StarSchema', () => {
    it('should accept valid Star data', () => {
      const data = SdeTestDataFactory.createStar();
      const result = StarSchema.parse(data);
      expect(result.starId).toBe(40009082);
      expect(result.name).toBe('Jita - Star');
      expect(result.spectralClass).toBe('K7 V');
    });

    it('should reject missing required fields', () => {
      expect(() => StarSchema.parse({ starId: 40009082 })).toThrow();
    });
  });

  describe('PlanetSchema', () => {
    it('should accept valid Planet data', () => {
      const data = SdeTestDataFactory.createPlanet();
      const result = PlanetSchema.parse(data);
      expect(result.planetId).toBe(40009077);
      expect(result.name).toBe('Jita I');
      expect(result.celestialIndex).toBe(1);
    });

    it('should reject missing required fields', () => {
      expect(() => PlanetSchema.parse({ planetId: 40009077 })).toThrow();
    });
  });

  describe('MoonSchema', () => {
    it('should accept valid Moon data', () => {
      const data = SdeTestDataFactory.createMoon();
      const result = MoonSchema.parse(data);
      expect(result.moonId).toBe(40009078);
      expect(result.name).toBe('Jita I - Moon 1');
      expect(result.celestialIndex).toBe(1);
    });

    it('should reject missing required fields', () => {
      expect(() => MoonSchema.parse({ moonId: 40009078 })).toThrow();
    });
  });

  describe('AsteroidBeltSchema', () => {
    it('should accept valid AsteroidBelt data', () => {
      const data = SdeTestDataFactory.createAsteroidBelt();
      const result = AsteroidBeltSchema.parse(data);
      expect(result.asteroidBeltId).toBe(40009079);
      expect(result.name).toBe('Jita I - Asteroid Belt 1');
      expect(result.celestialIndex).toBe(1);
    });

    it('should reject missing required fields', () => {
      expect(() =>
        AsteroidBeltSchema.parse({ asteroidBeltId: 40009079 }),
      ).toThrow();
    });
  });

  describe('FactionSchema', () => {
    it('should accept valid Faction data', () => {
      const data = SdeTestDataFactory.createFaction();
      const result = FactionSchema.parse(data);
      expect(result.factionId).toBe(500001);
      expect(result.name).toBe('Caldari State');
      expect(result.raceIds).toEqual([1]);
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createFaction({
        solarSystemId: null,
        corporationId: null,
        militiaCorporationId: null,
      });
      const result = FactionSchema.parse(data);
      expect(result.solarSystemId).toBeNull();
      expect(result.corporationId).toBeNull();
      expect(result.militiaCorporationId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => FactionSchema.parse({ factionId: 500001 })).toThrow();
    });
  });

  describe('RaceSchema', () => {
    it('should accept valid Race data', () => {
      const data = SdeTestDataFactory.createRace();
      const result = RaceSchema.parse(data);
      expect(result.raceId).toBe(1);
      expect(result.name).toBe('Caldari');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createRace({ iconId: null });
      const result = RaceSchema.parse(data);
      expect(result.iconId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => RaceSchema.parse({ raceId: 1 })).toThrow();
    });
  });

  describe('BloodlineSchema', () => {
    it('should accept valid Bloodline data', () => {
      const data = SdeTestDataFactory.createBloodline();
      const result = BloodlineSchema.parse(data);
      expect(result.bloodlineId).toBe(1);
      expect(result.name).toBe('Deteis');
      expect(result.raceId).toBe(1);
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createBloodline({ iconId: null });
      const result = BloodlineSchema.parse(data);
      expect(result.iconId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => BloodlineSchema.parse({ bloodlineId: 1 })).toThrow();
    });
  });

  describe('AncestrySchema', () => {
    it('should accept valid Ancestry data', () => {
      const data = SdeTestDataFactory.createAncestry();
      const result = AncestrySchema.parse(data);
      expect(result.ancestryId).toBe(1);
      expect(result.name).toBe('Tube Child');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createAncestry({ iconId: null });
      const result = AncestrySchema.parse(data);
      expect(result.iconId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => AncestrySchema.parse({ ancestryId: 1 })).toThrow();
    });
  });

  describe('NpcCorporationSchema', () => {
    it('should accept valid NpcCorporation data', () => {
      const data = SdeTestDataFactory.createNpcCorporation();
      const result = NpcCorporationSchema.parse(data);
      expect(result.corporationId).toBe(1000035);
      expect(result.name).toBe('Caldari Navy');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createNpcCorporation({
        factionId: null,
        solarSystemId: null,
        stationId: null,
        iconId: null,
        raceId: null,
      });
      const result = NpcCorporationSchema.parse(data);
      expect(result.factionId).toBeNull();
      expect(result.solarSystemId).toBeNull();
      expect(result.stationId).toBeNull();
      expect(result.iconId).toBeNull();
      expect(result.raceId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() =>
        NpcCorporationSchema.parse({ corporationId: 1000035 }),
      ).toThrow();
    });
  });

  describe('NpcStationSchema', () => {
    it('should accept valid NpcStation data', () => {
      const data = SdeTestDataFactory.createNpcStation();
      const result = NpcStationSchema.parse(data);
      expect(result.stationId).toBe(60003760);
      expect(result.name).toBe(
        'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      );
    });

    it('should reject missing required fields', () => {
      expect(() => NpcStationSchema.parse({ stationId: 60003760 })).toThrow();
    });
  });

  describe('MarketGroupSchema', () => {
    it('should accept valid MarketGroup data', () => {
      const data = SdeTestDataFactory.createMarketGroup();
      const result = MarketGroupSchema.parse(data);
      expect(result.marketGroupId).toBe(1857);
      expect(result.name).toBe('Minerals');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createMarketGroup({
        parentGroupId: null,
        iconId: null,
      });
      const result = MarketGroupSchema.parse(data);
      expect(result.parentGroupId).toBeNull();
      expect(result.iconId).toBeNull();
    });

    it('should handle boolean fields', () => {
      const data = SdeTestDataFactory.createMarketGroup({ hasTypes: false });
      const result = MarketGroupSchema.parse(data);
      expect(result.hasTypes).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(() => MarketGroupSchema.parse({ marketGroupId: 1857 })).toThrow();
    });
  });

  describe('MetaGroupSchema', () => {
    it('should accept valid MetaGroup data', () => {
      const data = SdeTestDataFactory.createMetaGroup();
      const result = MetaGroupSchema.parse(data);
      expect(result.metaGroupId).toBe(1);
      expect(result.name).toBe('Tech I');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createMetaGroup({ iconId: null });
      const result = MetaGroupSchema.parse(data);
      expect(result.iconId).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => MetaGroupSchema.parse({ metaGroupId: 1 })).toThrow();
    });
  });

  describe('IconSchema', () => {
    it('should accept valid Icon data', () => {
      const data = SdeTestDataFactory.createIcon();
      const result = IconSchema.parse(data);
      expect(result.iconId).toBe(22);
      expect(result.iconFile).toBe('res:/UI/Texture/Icons/22_32_2.png');
    });

    it('should reject missing required fields', () => {
      expect(() => IconSchema.parse({ iconId: 22 })).toThrow();
    });
  });

  describe('GraphicSchema', () => {
    it('should accept valid Graphic data', () => {
      const data = SdeTestDataFactory.createGraphic();
      const result = GraphicSchema.parse(data);
      expect(result.graphicId).toBe(20);
      expect(result.graphicFile).toBe(
        'res:/dx9/model/worldobject/asteroid/oreveld001.red',
      );
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createGraphic({
        sofFactionName: null,
        sofHullName: null,
        sofRaceName: null,
      });
      const result = GraphicSchema.parse(data);
      expect(result.sofFactionName).toBeNull();
      expect(result.sofHullName).toBeNull();
      expect(result.sofRaceName).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => GraphicSchema.parse({ graphicId: 20 })).toThrow();
    });
  });

  describe('DogmaAttributeSchema', () => {
    it('should accept valid DogmaAttribute data', () => {
      const data = SdeTestDataFactory.createDogmaAttribute();
      const result = DogmaAttributeSchema.parse(data);
      expect(result.attributeId).toBe(9);
      expect(result.name).toBe('hp');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createDogmaAttribute({
        categoryId: null,
        unitId: null,
        iconId: null,
      });
      const result = DogmaAttributeSchema.parse(data);
      expect(result.categoryId).toBeNull();
      expect(result.unitId).toBeNull();
      expect(result.iconId).toBeNull();
    });

    it('should handle boolean fields', () => {
      const data = SdeTestDataFactory.createDogmaAttribute({
        highIsGood: false,
        stackable: true,
        published: false,
      });
      const result = DogmaAttributeSchema.parse(data);
      expect(result.highIsGood).toBe(false);
      expect(result.stackable).toBe(true);
      expect(result.published).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(() => DogmaAttributeSchema.parse({ attributeId: 9 })).toThrow();
    });
  });

  describe('DogmaEffectSchema', () => {
    it('should accept valid DogmaEffect data', () => {
      const data = SdeTestDataFactory.createDogmaEffect();
      const result = DogmaEffectSchema.parse(data);
      expect(result.effectId).toBe(11);
      expect(result.name).toBe('lowSlotModifier');
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createDogmaEffect({
        categoryId: null,
        iconId: null,
        dischargeAttributeId: null,
        durationAttributeId: null,
        falloffAttributeId: null,
        rangeAttributeId: null,
        trackingSpeedAttributeId: null,
      });
      const result = DogmaEffectSchema.parse(data);
      expect(result.categoryId).toBeNull();
      expect(result.iconId).toBeNull();
    });

    it('should handle boolean fields', () => {
      const data = SdeTestDataFactory.createDogmaEffect({
        isAssistance: true,
        isOffensive: true,
        isWarpSafe: false,
        published: false,
      });
      const result = DogmaEffectSchema.parse(data);
      expect(result.isAssistance).toBe(true);
      expect(result.isOffensive).toBe(true);
      expect(result.isWarpSafe).toBe(false);
      expect(result.published).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(() => DogmaEffectSchema.parse({ effectId: 11 })).toThrow();
    });
  });

  describe('BlueprintSchema', () => {
    it('should accept valid Blueprint data', () => {
      const data = SdeTestDataFactory.createBlueprint();
      const result = BlueprintSchema.parse(data);
      expect(result.blueprintTypeId).toBe(787);
      expect(result.manufacturing).not.toBeNull();
      expect(result.manufacturing!.time).toBe(6000);
      expect(result.manufacturing!.materials).toHaveLength(2);
      expect(result.manufacturing!.products).toHaveLength(1);
    });

    it('should accept nullable fields as null', () => {
      const data = SdeTestDataFactory.createBlueprint({
        manufacturing: null,
        research: null,
        copying: null,
        invention: null,
      });
      const result = BlueprintSchema.parse(data);
      expect(result.manufacturing).toBeNull();
      expect(result.research).toBeNull();
      expect(result.copying).toBeNull();
      expect(result.invention).toBeNull();
    });

    it('should reject missing required fields', () => {
      expect(() => BlueprintSchema.parse({ blueprintTypeId: 787 })).toThrow();
    });
  });

  describe('PlanetSchematicSchema', () => {
    it('should accept valid PlanetSchematic data', () => {
      const data = SdeTestDataFactory.createPlanetSchematic();
      const result = PlanetSchematicSchema.parse(data);
      expect(result.planetSchematicId).toBe(65);
      expect(result.name).toBe('Bacteria');
      expect(result.cycleTime).toBe(1800);
      expect(result.types).toHaveLength(2);
    });

    it('should handle boolean fields in types', () => {
      const data = SdeTestDataFactory.createPlanetSchematic();
      const result = PlanetSchematicSchema.parse(data);
      expect(result.types[0]!.isInput).toBe(true);
      expect(result.types[1]!.isInput).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(() =>
        PlanetSchematicSchema.parse({ planetSchematicId: 65 }),
      ).toThrow();
    });
  });

  describe('SdeVersionSchema', () => {
    it('should accept valid version data', () => {
      const data = SdeTestDataFactory.createVersionInfo();
      const result = SdeVersionSchema.parse(data);
      expect(result.version).toBe('2024-01-15.1');
      expect(result.buildDate).toBe('2024-01-15T00:00:00Z');
    });

    it('should accept missing optional checksum', () => {
      const { checksum: _, ...dataWithoutChecksum } =
        SdeTestDataFactory.createVersionInfo();
      const result = SdeVersionSchema.parse(dataWithoutChecksum);
      expect(result.checksum).toBeUndefined();
    });

    it('should reject missing required fields', () => {
      expect(() => SdeVersionSchema.parse({ version: '1.0.0' })).toThrow();
    });
  });
});
