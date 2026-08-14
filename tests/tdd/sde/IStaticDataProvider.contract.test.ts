import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';

describe('IStaticDataProvider contract test suite', () => {
  it('should export the contract test runner', () => {
    expect(runProviderContractTests).toBeDefined();
  });
});

export function runProviderContractTests(
  name: string,
  createProvider: () => IStaticDataProvider,
): void {
  let provider: IStaticDataProvider;

  beforeEach(() => {
    provider = createProvider();
  });

  afterEach(() => {
    provider.close();
  });

  describe(`${name} — IStaticDataProvider contract`, () => {
    describe('type hierarchy', () => {
      it('should look up a type by ID', () => {
        const type = provider.getType(34);
        expect(type).not.toBeNull();
        expect(type!.typeId).toBe(34);
        expect(type!.name).toBe('Tritanium');
      });

      it('should return null for unknown type ID', () => {
        expect(provider.getType(999999)).toBeNull();
      });

      it('should find types by group', () => {
        const types = provider.getTypesByGroup(18);
        expect(types.length).toBeGreaterThanOrEqual(3);
        for (const type of types) {
          expect(type.groupId).toBe(18);
        }
      });

      it('should return empty array for unknown group', () => {
        expect(provider.getTypesByGroup(999999)).toEqual([]);
      });

      it('should look up a group by ID', () => {
        const group = provider.getGroup(18);
        expect(group).not.toBeNull();
        expect(group!.groupId).toBe(18);
        expect(group!.name).toBe('Mineral');
      });

      it('should return null for unknown group ID', () => {
        expect(provider.getGroup(999999)).toBeNull();
      });

      it('should find groups by category', () => {
        const groups = provider.getGroupsByCategory(4);
        expect(groups.length).toBeGreaterThanOrEqual(1);
        for (const group of groups) {
          expect(group.categoryId).toBe(4);
        }
      });

      it('should look up a category by ID', () => {
        const category = provider.getCategory(4);
        expect(category).not.toBeNull();
        expect(category!.categoryId).toBe(4);
        expect(category!.name).toBe('Material');
      });

      it('should return null for unknown category ID', () => {
        expect(provider.getCategory(999999)).toBeNull();
      });

      it('should list all categories', () => {
        const categories = provider.getAllCategories();
        expect(categories.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('geography hierarchy', () => {
      it('should look up a region by ID', () => {
        const region = provider.getRegion(10000002);
        expect(region).not.toBeNull();
        expect(region!.regionId).toBe(10000002);
        expect(region!.name).toBe('The Forge');
      });

      it('should return null for unknown region ID', () => {
        expect(provider.getRegion(999999)).toBeNull();
      });

      it('should list all regions', () => {
        const regions = provider.getAllRegions();
        expect(regions.length).toBeGreaterThanOrEqual(1);
      });

      it('should look up a constellation by ID', () => {
        const constellation = provider.getConstellation(20000020);
        expect(constellation).not.toBeNull();
        expect(constellation!.constellationId).toBe(20000020);
        expect(constellation!.name).toBe('Kimotoro');
      });

      it('should return null for unknown constellation ID', () => {
        expect(provider.getConstellation(999999)).toBeNull();
      });

      it('should find constellations by region', () => {
        const constellations = provider.getConstellationsByRegion(10000002);
        expect(constellations.length).toBeGreaterThanOrEqual(1);
        for (const c of constellations) {
          expect(c.regionId).toBe(10000002);
        }
      });

      it('should look up a solar system by ID', () => {
        const system = provider.getSolarSystem(30000142);
        expect(system).not.toBeNull();
        expect(system!.systemId).toBe(30000142);
        expect(system!.name).toBe('Jita');
      });

      it('should return null for unknown system ID', () => {
        expect(provider.getSolarSystem(999999)).toBeNull();
      });

      it('should find solar systems by constellation', () => {
        const systems = provider.getSolarSystemsByConstellation(20000020);
        expect(systems.length).toBeGreaterThanOrEqual(2);
        for (const s of systems) {
          expect(s.constellationId).toBe(20000020);
        }
      });

      it('should look up a stargate by ID', () => {
        const stargate = provider.getStargate(50001248);
        expect(stargate).not.toBeNull();
        expect(stargate!.stargateId).toBe(50001248);
      });

      it('should return null for unknown stargate ID', () => {
        expect(provider.getStargate(999999)).toBeNull();
      });

      it('should find stargates by system', () => {
        const stargates = provider.getStargatesBySystem(30000142);
        expect(stargates.length).toBeGreaterThanOrEqual(1);
        for (const s of stargates) {
          expect(s.systemId).toBe(30000142);
        }
      });
    });

    describe('search', () => {
      it('should search types by name (case-insensitive)', () => {
        const results = provider.searchTypesByName('trit');
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0]!.name.toLowerCase()).toContain('trit');
      });

      it('should return empty for non-matching search', () => {
        expect(provider.searchTypesByName('zzzznonexistent')).toEqual([]);
      });

      it('should respect search limit', () => {
        const results = provider.searchTypesByName('', 1);
        expect(results.length).toBeLessThanOrEqual(1);
      });

      it('should search solar systems by name', () => {
        const results = provider.searchSolarSystemsByName('Jita');
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0]!.name).toBe('Jita');
      });

      it('should return empty for non-matching system search', () => {
        expect(provider.searchSolarSystemsByName('zzzznonexistent')).toEqual(
          [],
        );
      });
    });

    describe('version metadata', () => {
      it('should return version info', () => {
        const version = provider.getVersion();
        expect(version.version).toBeDefined();
        expect(version.buildDate).toBeDefined();
        expect(version.importedAt).toBeDefined();
      });
    });
  });
}
