import {
  EveTypeSchema,
  EveGroupSchema,
  EveCategorySchema,
  RegionSchema,
  ConstellationSchema,
  SolarSystemSchema,
  StargateSchema,
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
