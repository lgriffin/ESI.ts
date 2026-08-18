import type {
  EveType,
  EveGroup,
  EveCategory,
  Region,
  Constellation,
  SolarSystem,
  Stargate,
  Star,
  Planet,
  Moon,
  AsteroidBelt,
  Faction,
  Race,
  Bloodline,
  Ancestry,
  NpcCorporation,
  NpcStation,
  MarketGroup,
  MetaGroup,
  Icon,
  Graphic,
  DogmaAttribute,
  DogmaEffect,
  Blueprint,
  PlanetSchematic,
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

  static createStar(overrides: Partial<Star> = {}): Star {
    return {
      starId: 40009082,
      solarSystemId: 30000142,
      name: 'Jita - Star',
      typeId: 3796,
      age: 76000000000,
      luminosity: 0.02142,
      radius: 346600000,
      spectralClass: 'K7 V',
      temperature: 4000,
      ...overrides,
    };
  }

  static createPlanet(overrides: Partial<Planet> = {}): Planet {
    return {
      planetId: 40009077,
      solarSystemId: 30000142,
      name: 'Jita I',
      typeId: 2015,
      celestialIndex: 1,
      ...overrides,
    };
  }

  static createMoon(overrides: Partial<Moon> = {}): Moon {
    return {
      moonId: 40009078,
      planetId: 40009077,
      name: 'Jita I - Moon 1',
      typeId: 14,
      celestialIndex: 1,
      ...overrides,
    };
  }

  static createAsteroidBelt(
    overrides: Partial<AsteroidBelt> = {},
  ): AsteroidBelt {
    return {
      asteroidBeltId: 40009079,
      solarSystemId: 30000142,
      name: 'Jita I - Asteroid Belt 1',
      typeId: 15,
      celestialIndex: 1,
      ...overrides,
    };
  }

  static createFaction(overrides: Partial<Faction> = {}): Faction {
    return {
      factionId: 500001,
      name: 'Caldari State',
      description: 'The Caldari State is a corporate dictatorship.',
      raceIds: [1],
      solarSystemId: 30000142,
      corporationId: 1000035,
      militiaCorporationId: 1000180,
      sizeFactor: 5.0,
      ...overrides,
    };
  }

  static createRace(overrides: Partial<Race> = {}): Race {
    return {
      raceId: 1,
      name: 'Caldari',
      description: 'The Caldari State is a corporate dictatorship.',
      iconId: 1439,
      ...overrides,
    };
  }

  static createBloodline(overrides: Partial<Bloodline> = {}): Bloodline {
    return {
      bloodlineId: 1,
      raceId: 1,
      name: 'Deteis',
      description: 'The Deteis are regarded as the face of the Caldari State.',
      shipTypeId: 601,
      corporationId: 1000006,
      iconId: 1383,
      ...overrides,
    };
  }

  static createAncestry(overrides: Partial<Ancestry> = {}): Ancestry {
    return {
      ancestryId: 1,
      bloodlineId: 1,
      name: 'Tube Child',
      description: 'Born and raised in a capsule.',
      iconId: 1664,
      ...overrides,
    };
  }

  static createNpcCorporation(
    overrides: Partial<NpcCorporation> = {},
  ): NpcCorporation {
    return {
      corporationId: 1000035,
      name: 'Caldari Navy',
      factionId: 500001,
      solarSystemId: 30000142,
      stationId: 60003760,
      description: 'The Caldari Navy is the armed forces of the Caldari State.',
      iconId: 1439,
      raceId: 1,
      ...overrides,
    };
  }

  static createNpcStation(overrides: Partial<NpcStation> = {}): NpcStation {
    return {
      stationId: 60003760,
      name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
      solarSystemId: 30000142,
      typeId: 1529,
      corporationId: 1000035,
      regionId: 10000002,
      constellationId: 20000020,
      security: 0.9459991455078125,
      reprocessingEfficiency: 0.5,
      reprocessingStationsTake: 0.05,
      ...overrides,
    };
  }

  static createMarketGroup(overrides: Partial<MarketGroup> = {}): MarketGroup {
    return {
      marketGroupId: 1857,
      name: 'Minerals',
      description: 'Refined minerals used in manufacturing.',
      parentGroupId: 1031,
      iconId: 22,
      hasTypes: true,
      ...overrides,
    };
  }

  static createMetaGroup(overrides: Partial<MetaGroup> = {}): MetaGroup {
    return {
      metaGroupId: 1,
      name: 'Tech I',
      description: 'Standard technology.',
      iconId: null,
      ...overrides,
    };
  }

  static createIcon(overrides: Partial<Icon> = {}): Icon {
    return {
      iconId: 22,
      iconFile: 'res:/UI/Texture/Icons/22_32_2.png',
      description: 'Minerals',
      ...overrides,
    };
  }

  static createGraphic(overrides: Partial<Graphic> = {}): Graphic {
    return {
      graphicId: 20,
      graphicFile: 'res:/dx9/model/worldobject/asteroid/oreveld001.red',
      description: '',
      sofFactionName: null,
      sofHullName: null,
      sofRaceName: null,
      ...overrides,
    };
  }

  static createDogmaAttribute(
    overrides: Partial<DogmaAttribute> = {},
  ): DogmaAttribute {
    return {
      attributeId: 9,
      name: 'hp',
      description: 'Hit points for a ship.',
      categoryId: 1,
      defaultValue: 0,
      highIsGood: true,
      stackable: false,
      unitId: 1,
      iconId: null,
      published: true,
      ...overrides,
    };
  }

  static createDogmaEffect(overrides: Partial<DogmaEffect> = {}): DogmaEffect {
    return {
      effectId: 11,
      name: 'lowSlotModifier',
      description: 'Low slot passive effect.',
      categoryId: 0,
      isAssistance: false,
      isOffensive: false,
      isWarpSafe: true,
      published: true,
      iconId: null,
      dischargeAttributeId: null,
      durationAttributeId: null,
      falloffAttributeId: null,
      rangeAttributeId: null,
      trackingSpeedAttributeId: null,
      ...overrides,
    };
  }

  static createBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
    return {
      blueprintTypeId: 787,
      maxProductionLimit: 10,
      manufacturing: {
        time: 6000,
        materials: [
          { typeId: 34, quantity: 100 },
          { typeId: 35, quantity: 50 },
        ],
        products: [{ typeId: 587, quantity: 1, probability: null }],
      },
      research: null,
      copying: null,
      invention: null,
      ...overrides,
    };
  }

  static createPlanetSchematic(
    overrides: Partial<PlanetSchematic> = {},
  ): PlanetSchematic {
    return {
      planetSchematicId: 65,
      name: 'Bacteria',
      cycleTime: 1800,
      types: [
        { typeId: 2393, isInput: true, quantity: 3000 },
        { typeId: 2396, isInput: false, quantity: 20 },
      ],
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

    const star = this.createStar({ solarSystemId: system1.systemId });
    const planet = this.createPlanet({ solarSystemId: system1.systemId });
    const moon = this.createMoon({ planetId: planet.planetId });
    const asteroidBelt = this.createAsteroidBelt({
      solarSystemId: system1.systemId,
    });

    const race = this.createRace();
    const faction = this.createFaction({ raceIds: [race.raceId] });
    const bloodline = this.createBloodline({ raceId: race.raceId });
    const ancestry = this.createAncestry({
      bloodlineId: bloodline.bloodlineId,
    });
    const npcCorp = this.createNpcCorporation({
      factionId: faction.factionId,
      raceId: race.raceId,
    });
    const npcStation = this.createNpcStation({
      solarSystemId: system1.systemId,
      corporationId: npcCorp.corporationId,
      regionId: region.regionId,
      constellationId: constellation.constellationId,
    });

    const rootMarketGroup = this.createMarketGroup({
      marketGroupId: 1031,
      name: 'Manufacture & Research',
      parentGroupId: null,
      hasTypes: false,
    });
    const marketGroup = this.createMarketGroup({
      parentGroupId: rootMarketGroup.marketGroupId,
    });
    const metaGroup = this.createMetaGroup();
    const icon = this.createIcon();
    const graphic = this.createGraphic();

    const dogmaAttribute = this.createDogmaAttribute();
    const dogmaEffect = this.createDogmaEffect();
    const blueprint = this.createBlueprint();
    const planetSchematic = this.createPlanetSchematic();

    return {
      categories: [category],
      groups: [group],
      types: [type1, type2, type3],
      regions: [region],
      constellations: [constellation],
      solarSystems: [system1, system2],
      stargates: [stargate],
      stars: [star],
      planets: [planet],
      moons: [moon],
      asteroidBelts: [asteroidBelt],
      factions: [faction],
      races: [race],
      bloodlines: [bloodline],
      ancestries: [ancestry],
      npcCorporations: [npcCorp],
      npcStations: [npcStation],
      marketGroups: [rootMarketGroup, marketGroup],
      metaGroups: [metaGroup],
      icons: [icon],
      graphics: [graphic],
      dogmaAttributes: [dogmaAttribute],
      dogmaEffects: [dogmaEffect],
      blueprints: [blueprint],
      planetSchematics: [planetSchematic],
      version: this.createVersionInfo(),
    };
  }
}
