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
import type { MemorySdeData } from './MemorySdeProvider';

export class SdeTestDataFactory {
  static createEveType(overrides: Partial<EveType> = {}): EveType {
    return {
      typeId: 34,
      groupId: 18,
      name: 'Tritanium',
      description: 'The most common mineral in the known universe.',
      mass: 1.0,
      volume: 0.01,
      capacity: 0,
      portionSize: 1,
      published: true,
      marketGroupId: 1857,
      iconId: null,
      graphicId: 20,
      ...overrides,
    };
  }

  static createEveGroup(overrides: Partial<EveGroup> = {}): EveGroup {
    return {
      groupId: 18,
      categoryId: 4,
      name: 'Mineral',
      published: true,
      ...overrides,
    };
  }

  static createEveCategory(overrides: Partial<EveCategory> = {}): EveCategory {
    return {
      categoryId: 4,
      name: 'Material',
      published: true,
      ...overrides,
    };
  }

  static createRegion(overrides: Partial<Region> = {}): Region {
    return {
      regionId: 10000002,
      name: 'The Forge',
      description: 'The Forge is the industrial heart of the Caldari State.',
      ...overrides,
    };
  }

  static createConstellation(
    overrides: Partial<Constellation> = {},
  ): Constellation {
    return {
      constellationId: 20000020,
      regionId: 10000002,
      name: 'Kimotoro',
      ...overrides,
    };
  }

  static createSolarSystem(overrides: Partial<SolarSystem> = {}): SolarSystem {
    return {
      systemId: 30000142,
      constellationId: 20000020,
      regionId: 10000002,
      name: 'Jita',
      securityStatus: 0.9459991455078125,
      securityClass: 'B',
      ...overrides,
    };
  }

  static createStargate(overrides: Partial<Stargate> = {}): Stargate {
    return {
      stargateId: 50001248,
      systemId: 30000142,
      typeId: 16,
      destinationStargateId: 50001249,
      destinationSystemId: 30000144,
      ...overrides,
    };
  }

  static createVersionInfo(
    overrides: Partial<SdeVersionInfo> = {},
  ): SdeVersionInfo {
    return {
      version: '2024-01-15.1',
      buildDate: '2024-01-15T00:00:00Z',
      importedAt: '2024-01-16T12:00:00Z',
      checksum: 'abc123def456',
      ...overrides,
    };
  }

  static createHierarchicalTestData(): MemorySdeData {
    const category = this.createEveCategory();
    const group = this.createEveGroup({ categoryId: category.categoryId });
    const type1 = this.createEveType({
      typeId: 34,
      name: 'Tritanium',
      groupId: group.groupId,
    });
    const type2 = this.createEveType({
      typeId: 35,
      name: 'Pyerite',
      groupId: group.groupId,
    });
    const type3 = this.createEveType({
      typeId: 36,
      name: 'Mexallon',
      groupId: group.groupId,
    });

    const region = this.createRegion();
    const constellation = this.createConstellation({
      regionId: region.regionId,
    });
    const system1 = this.createSolarSystem({
      systemId: 30000142,
      name: 'Jita',
      constellationId: constellation.constellationId,
      regionId: region.regionId,
    });
    const system2 = this.createSolarSystem({
      systemId: 30000144,
      name: 'Perimeter',
      constellationId: constellation.constellationId,
      regionId: region.regionId,
      securityStatus: 0.9,
    });
    const stargate = this.createStargate({
      systemId: system1.systemId,
      destinationSystemId: system2.systemId,
    });

    return {
      categories: [category],
      groups: [group],
      types: [type1, type2, type3],
      regions: [region],
      constellations: [constellation],
      solarSystems: [system1, system2],
      stargates: [stargate],
      version: this.createVersionInfo(),
    };
  }
}
