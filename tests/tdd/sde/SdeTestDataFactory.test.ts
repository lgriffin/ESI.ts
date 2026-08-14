import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
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
  });
});
