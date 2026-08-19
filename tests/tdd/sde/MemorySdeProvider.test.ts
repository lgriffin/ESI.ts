import { MemorySdeProvider } from '../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import { runProviderContractTests } from './IStaticDataProvider.contract.test';

describe('MemorySdeProvider', () => {
  runProviderContractTests(
    'MemorySdeProvider',
    () =>
      new MemorySdeProvider(SdeTestDataFactory.createHierarchicalTestData()),
  );

  describe('empty state', () => {
    it('should return null for all single lookups when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.getType(34)).toBeNull();
      expect(provider.getGroup(18)).toBeNull();
      expect(provider.getCategory(4)).toBeNull();
      expect(provider.getRegion(10000002)).toBeNull();
      expect(provider.getConstellation(20000020)).toBeNull();
      expect(provider.getSolarSystem(30000142)).toBeNull();
      expect(provider.getStargate(50001248)).toBeNull();
      expect(provider.getStar(40009082)).toBeNull();
      expect(provider.getStarBySystem(30000142)).toBeNull();
      expect(provider.getPlanet(40009077)).toBeNull();
      expect(provider.getMoon(40009078)).toBeNull();
      expect(provider.getAsteroidBelt(40009079)).toBeNull();
      expect(provider.getFaction(500001)).toBeNull();
      expect(provider.getRace(1)).toBeNull();
      expect(provider.getBloodline(1)).toBeNull();
      expect(provider.getAncestry(1)).toBeNull();
      expect(provider.getNpcCorporation(1000035)).toBeNull();
      expect(provider.getNpcStation(60003760)).toBeNull();
      expect(provider.getMarketGroup(1857)).toBeNull();
      expect(provider.getMetaGroup(1)).toBeNull();
      expect(provider.getIcon(22)).toBeNull();
      expect(provider.getGraphic(20)).toBeNull();
      expect(provider.getDogmaAttribute(9)).toBeNull();
      expect(provider.getDogmaEffect(11)).toBeNull();
      expect(provider.getBlueprint(787)).toBeNull();
      expect(provider.getPlanetSchematic(65)).toBeNull();
    });

    it('should return empty arrays for collection lookups when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.getTypesByGroup(18)).toEqual([]);
      expect(provider.getGroupsByCategory(4)).toEqual([]);
      expect(provider.getAllCategories()).toEqual([]);
      expect(provider.getAllRegions()).toEqual([]);
      expect(provider.getConstellationsByRegion(10000002)).toEqual([]);
      expect(provider.getSolarSystemsByConstellation(20000020)).toEqual([]);
      expect(provider.getStargatesBySystem(30000142)).toEqual([]);
      expect(provider.getPlanetsBySystem(30000142)).toEqual([]);
      expect(provider.getMoonsBySystem(30000142)).toEqual([]);
      expect(provider.getAsteroidBeltsBySystem(30000142)).toEqual([]);
      expect(provider.getAllFactions()).toEqual([]);
      expect(provider.getAllRaces()).toEqual([]);
      expect(provider.getBloodlinesByRace(1)).toEqual([]);
      expect(provider.getAncestriesByBloodline(1)).toEqual([]);
      expect(provider.getNpcCorporationsByFaction(500001)).toEqual([]);
      expect(provider.getNpcStationsBySystem(30000142)).toEqual([]);
      expect(provider.getNpcStationsByOwner(1000035)).toEqual([]);
      expect(provider.getMarketGroupsByParent(1031)).toEqual([]);
      expect(provider.getRootMarketGroups()).toEqual([]);
      expect(provider.getTypesByMarketGroup(1857)).toEqual([]);
      expect(provider.getAllMetaGroups()).toEqual([]);
      expect(provider.getAllPlanetSchematics()).toEqual([]);
    });

    it('should return empty search results when empty', () => {
      const provider = new MemorySdeProvider();
      expect(provider.searchTypesByName('Trit')).toEqual([]);
      expect(provider.searchSolarSystemsByName('Jita')).toEqual([]);
      expect(provider.searchMarketGroupsByName('Minerals')).toEqual([]);
      expect(provider.searchDogmaAttributesByName('hp')).toEqual([]);
      expect(provider.searchDogmaEffectsByName('low')).toEqual([]);
    });

    it('should return default version info when empty', () => {
      const provider = new MemorySdeProvider();
      const version = provider.getVersion();
      expect(version.version).toBe('1.0.0-test');
    });
  });

  describe('close', () => {
    it('should clear all data after close', () => {
      const provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
      expect(provider.getType(34)).not.toBeNull();
      provider.close();
      expect(provider.getType(34)).toBeNull();
    });
  });

  describe('version info', () => {
    it('should return a copy of version info', () => {
      const provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
      const v1 = provider.getVersion();
      const v2 = provider.getVersion();
      expect(v1).toEqual(v2);
      expect(v1).not.toBe(v2);
    });
  });
});
