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
          expect(s.solarSystemId).toBe(30000142);
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

    describe('universe hierarchy (extended)', () => {
      it('should look up a star by ID', () => {
        const star = provider.getStar(40009082);
        expect(star).not.toBeNull();
        expect(star!.starId).toBe(40009082);
        expect(star!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown star ID', () => {
        expect(provider.getStar(999999)).toBeNull();
      });

      it('should find star by system', () => {
        const star = provider.getStarBySystem(30000142);
        expect(star).not.toBeNull();
        expect(star!.solarSystemId).toBe(30000142);
      });

      it('should return null for star in unknown system', () => {
        expect(provider.getStarBySystem(999999)).toBeNull();
      });

      it('should look up a planet by ID', () => {
        const planet = provider.getPlanet(40009077);
        expect(planet).not.toBeNull();
        expect(planet!.planetId).toBe(40009077);
        expect(planet!.celestialIndex).toBe(1);
      });

      it('should return null for unknown planet ID', () => {
        expect(provider.getPlanet(999999)).toBeNull();
      });

      it('should find planets by system', () => {
        const planets = provider.getPlanetsBySystem(30000142);
        expect(planets.length).toBeGreaterThanOrEqual(1);
        for (const p of planets) {
          expect(p.solarSystemId).toBe(30000142);
        }
      });

      it('should return empty array for planets in unknown system', () => {
        expect(provider.getPlanetsBySystem(999999)).toEqual([]);
      });

      it('should look up a moon by ID', () => {
        const moon = provider.getMoon(40009078);
        expect(moon).not.toBeNull();
        expect(moon!.moonId).toBe(40009078);
        expect(moon!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown moon ID', () => {
        expect(provider.getMoon(999999)).toBeNull();
      });

      it('should find moons by system', () => {
        const moons = provider.getMoonsBySystem(30000142);
        expect(moons.length).toBeGreaterThanOrEqual(1);
        for (const m of moons) {
          expect(m.solarSystemId).toBe(30000142);
        }
      });

      it('should return empty array for moons of unknown system', () => {
        expect(provider.getMoonsBySystem(999999)).toEqual([]);
      });

      it('should look up an asteroid belt by ID', () => {
        const belt = provider.getAsteroidBelt(40009079);
        expect(belt).not.toBeNull();
        expect(belt!.asteroidBeltId).toBe(40009079);
        expect(belt!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown asteroid belt ID', () => {
        expect(provider.getAsteroidBelt(999999)).toBeNull();
      });

      it('should find asteroid belts by system', () => {
        const belts = provider.getAsteroidBeltsBySystem(30000142);
        expect(belts.length).toBeGreaterThanOrEqual(1);
        for (const b of belts) {
          expect(b.solarSystemId).toBe(30000142);
        }
      });

      it('should return empty array for belts in unknown system', () => {
        expect(provider.getAsteroidBeltsBySystem(999999)).toEqual([]);
      });
    });

    describe('character and lore', () => {
      it('should look up a faction by ID', () => {
        const faction = provider.getFaction(500001);
        expect(faction).not.toBeNull();
        expect(faction!.factionId).toBe(500001);
        expect(faction!.name).toBe('Caldari State');
      });

      it('should return null for unknown faction ID', () => {
        expect(provider.getFaction(999999)).toBeNull();
      });

      it('should list all factions', () => {
        const factions = provider.getAllFactions();
        expect(factions.length).toBeGreaterThanOrEqual(1);
      });

      it('should look up a race by ID', () => {
        const race = provider.getRace(1);
        expect(race).not.toBeNull();
        expect(race!.raceId).toBe(1);
        expect(race!.name).toBe('Caldari');
      });

      it('should return null for unknown race ID', () => {
        expect(provider.getRace(999999)).toBeNull();
      });

      it('should list all races', () => {
        const races = provider.getAllRaces();
        expect(races.length).toBeGreaterThanOrEqual(1);
      });

      it('should look up a bloodline by ID', () => {
        const bloodline = provider.getBloodline(1);
        expect(bloodline).not.toBeNull();
        expect(bloodline!.bloodlineId).toBe(1);
        expect(bloodline!.name).toBe('Deteis');
      });

      it('should return null for unknown bloodline ID', () => {
        expect(provider.getBloodline(999999)).toBeNull();
      });

      it('should find bloodlines by race', () => {
        const bloodlines = provider.getBloodlinesByRace(1);
        expect(bloodlines.length).toBeGreaterThanOrEqual(1);
        for (const b of bloodlines) {
          expect(b.raceId).toBe(1);
        }
      });

      it('should return empty array for bloodlines of unknown race', () => {
        expect(provider.getBloodlinesByRace(999999)).toEqual([]);
      });

      it('should look up an ancestry by ID', () => {
        const ancestry = provider.getAncestry(1);
        expect(ancestry).not.toBeNull();
        expect(ancestry!.ancestryId).toBe(1);
        expect(ancestry!.name).toBe('Tube Child');
      });

      it('should return null for unknown ancestry ID', () => {
        expect(provider.getAncestry(999999)).toBeNull();
      });

      it('should find ancestries by bloodline', () => {
        const ancestries = provider.getAncestriesByBloodline(1);
        expect(ancestries.length).toBeGreaterThanOrEqual(1);
        for (const a of ancestries) {
          expect(a.bloodlineId).toBe(1);
        }
      });

      it('should return empty array for ancestries of unknown bloodline', () => {
        expect(provider.getAncestriesByBloodline(999999)).toEqual([]);
      });
    });

    describe('NPC infrastructure', () => {
      it('should look up an NPC corporation by ID', () => {
        const corp = provider.getNpcCorporation(1000035);
        expect(corp).not.toBeNull();
        expect(corp!.corporationId).toBe(1000035);
        expect(corp!.name).toBe('Caldari Navy');
      });

      it('should return null for unknown NPC corporation ID', () => {
        expect(provider.getNpcCorporation(999999)).toBeNull();
      });

      it('should find NPC corporations by faction', () => {
        const corps = provider.getNpcCorporationsByFaction(500001);
        expect(corps.length).toBeGreaterThanOrEqual(1);
        for (const c of corps) {
          expect(c.factionId).toBe(500001);
        }
      });

      it('should return empty array for corps of unknown faction', () => {
        expect(provider.getNpcCorporationsByFaction(999999)).toEqual([]);
      });

      it('should look up an NPC station by ID', () => {
        const station = provider.getNpcStation(60003760);
        expect(station).not.toBeNull();
        expect(station!.stationId).toBe(60003760);
        expect(station!.solarSystemId).toBe(30000142);
      });

      it('should return null for unknown NPC station ID', () => {
        expect(provider.getNpcStation(999999)).toBeNull();
      });

      it('should find NPC stations by system', () => {
        const stations = provider.getNpcStationsBySystem(30000142);
        expect(stations.length).toBeGreaterThanOrEqual(1);
        for (const s of stations) {
          expect(s.solarSystemId).toBe(30000142);
        }
      });

      it('should return empty array for stations in unknown system', () => {
        expect(provider.getNpcStationsBySystem(999999)).toEqual([]);
      });

      it('should find NPC stations by owner', () => {
        const stations = provider.getNpcStationsByOwner(1000035);
        expect(stations.length).toBeGreaterThanOrEqual(1);
        for (const s of stations) {
          expect(s.ownerId).toBe(1000035);
        }
      });

      it('should return empty for stations with unknown owner', () => {
        expect(provider.getNpcStationsByOwner(999999)).toEqual([]);
      });
    });

    describe('market and meta', () => {
      it('should look up a market group by ID', () => {
        const group = provider.getMarketGroup(1857);
        expect(group).not.toBeNull();
        expect(group!.marketGroupId).toBe(1857);
        expect(group!.name).toBe('Minerals');
      });

      it('should return null for unknown market group ID', () => {
        expect(provider.getMarketGroup(999999)).toBeNull();
      });

      it('should find market groups by parent', () => {
        const groups = provider.getMarketGroupsByParent(1031);
        expect(groups.length).toBeGreaterThanOrEqual(1);
        for (const g of groups) {
          expect(g.parentGroupId).toBe(1031);
        }
      });

      it('should return empty array for groups with unknown parent', () => {
        expect(provider.getMarketGroupsByParent(999999)).toEqual([]);
      });

      it('should return root market groups with null parentGroupId', () => {
        const roots = provider.getRootMarketGroups();
        expect(roots.length).toBeGreaterThanOrEqual(1);
        for (const g of roots) {
          expect(g.parentGroupId).toBeNull();
        }
      });

      it('should look up a meta group by ID', () => {
        const group = provider.getMetaGroup(1);
        expect(group).not.toBeNull();
        expect(group!.metaGroupId).toBe(1);
        expect(group!.name).toBe('Tech I');
      });

      it('should return null for unknown meta group ID', () => {
        expect(provider.getMetaGroup(999999)).toBeNull();
      });

      it('should list all meta groups', () => {
        const groups = provider.getAllMetaGroups();
        expect(groups.length).toBeGreaterThanOrEqual(1);
      });

      it('should look up an icon by ID', () => {
        const icon = provider.getIcon(22);
        expect(icon).not.toBeNull();
        expect(icon!.iconId).toBe(22);
      });

      it('should return null for unknown icon ID', () => {
        expect(provider.getIcon(999999)).toBeNull();
      });

      it('should look up a graphic by ID', () => {
        const graphic = provider.getGraphic(20);
        expect(graphic).not.toBeNull();
        expect(graphic!.graphicId).toBe(20);
      });

      it('should return null for unknown graphic ID', () => {
        expect(provider.getGraphic(999999)).toBeNull();
      });
    });

    describe('dogma', () => {
      it('should look up a dogma attribute by ID', () => {
        const attr = provider.getDogmaAttribute(9);
        expect(attr).not.toBeNull();
        expect(attr!.name).toBe('hp');
      });

      it('should return null for unknown dogma attribute ID', () => {
        expect(provider.getDogmaAttribute(999999)).toBeNull();
      });

      it('should search dogma attributes by name', () => {
        const results = provider.searchDogmaAttributesByName('hp');
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0]!.name.toLowerCase()).toContain('hp');
      });

      it('should return empty for non-matching attribute search', () => {
        expect(provider.searchDogmaAttributesByName('zzzznonexistent')).toEqual(
          [],
        );
      });

      it('should look up a dogma effect by ID', () => {
        const effect = provider.getDogmaEffect(11);
        expect(effect).not.toBeNull();
        expect(effect!.name).toBe('lowSlotModifier');
      });

      it('should return null for unknown dogma effect ID', () => {
        expect(provider.getDogmaEffect(999999)).toBeNull();
      });

      it('should search dogma effects by name', () => {
        const results = provider.searchDogmaEffectsByName('low');
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0]!.name.toLowerCase()).toContain('low');
      });

      it('should return empty for non-matching effect search', () => {
        expect(provider.searchDogmaEffectsByName('zzzznonexistent')).toEqual(
          [],
        );
      });
    });

    describe('industry', () => {
      it('should look up a blueprint by type ID', () => {
        const bp = provider.getBlueprint(787);
        expect(bp).not.toBeNull();
        expect(bp!.blueprintTypeId).toBe(787);
        expect(bp!.activities.manufacturing).not.toBeUndefined();
        expect(bp!.activities.manufacturing!.time).toBe(6000);
      });

      it('should return null for unknown blueprint type ID', () => {
        expect(provider.getBlueprint(999999)).toBeNull();
      });

      it('should look up a planet schematic by ID', () => {
        const schematic = provider.getPlanetSchematic(65);
        expect(schematic).not.toBeNull();
        expect(schematic!.planetSchematicId).toBe(65);
        expect(schematic!.name).toBe('Bacteria');
      });

      it('should return null for unknown planet schematic ID', () => {
        expect(provider.getPlanetSchematic(999999)).toBeNull();
      });

      it('should list all planet schematics', () => {
        const schematics = provider.getAllPlanetSchematics();
        expect(schematics.length).toBeGreaterThanOrEqual(1);
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
