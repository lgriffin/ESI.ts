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
      mass: 1,
      name: 'Tritanium',
      portionSize: 1,
      published: true,
      packagedVolume: null,
      volume: 0.01,
      radius: null,
      description: 'The most common mineral in the known universe.',
      graphicId: 20,
      soundId: null,
      iconId: null,
      raceId: null,
      basePrice: 4,
      marketGroupId: 1857,
      capacity: null,
      isRepackable: null,
      ...overrides,
    };
  }

  static createEveGroup(overrides: Partial<EveGroup> = {}): EveGroup {
    return {
      groupId: 18,
      anchorable: false,
      anchored: false,
      categoryId: 4,
      fittableNonSingleton: false,
      name: 'Mineral',
      published: true,
      useBasePrice: true,
      iconId: null,
      ...overrides,
    };
  }

  static createEveCategory(overrides: Partial<EveCategory> = {}): EveCategory {
    return {
      categoryId: 4,
      name: 'Material',
      published: true,
      iconId: null,
      ...overrides,
    };
  }

  static createRegion(overrides: Partial<Region> = {}): Region {
    return {
      regionId: 10000002,
      constellationIDs: [20000020],
      description: 'The Forge is the industrial heart of the Caldari State.',
      factionId: 500001,
      name: 'The Forge',
      nebulaId: 10,
      position: { x: -9.6e16, y: 6.0e16, z: -1.1e17 },
      wormholeClassId: 0,
      ...overrides,
    };
  }

  static createConstellation(
    overrides: Partial<Constellation> = {},
  ): Constellation {
    return {
      constellationId: 20000020,
      factionId: 500001,
      name: 'Kimotoro',
      position: { x: -9.7e16, y: 6.1e16, z: -1.15e17 },
      regionId: 10000002,
      solarSystemIDs: [30000142, 30000144],
      wormholeClassId: 0,
      ...overrides,
    };
  }

  static createSolarSystem(overrides: Partial<SolarSystem> = {}): SolarSystem {
    return {
      systemId: 30000142,
      border: false,
      constellationId: 20000020,
      hub: true,
      international: false,
      luminosity: 0.02142,
      name: 'Jita',
      planetIDs: [40009077],
      position: { x: -1.29e17, y: 6.07e16, z: -1.12e17 },
      position2D: { x: -1.29e17, y: -1.12e17 },
      radius: 4.67e12,
      regionId: 10000002,
      regional: false,
      securityClass: 'B',
      securityStatus: 0.9459991455078125,
      starId: 40009082,
      stargateIDs: [50001248],
      corridor: null,
      fringe: null,
      wormholeClassId: null,
      visualEffect: null,
      ...overrides,
    };
  }

  static createStargate(overrides: Partial<Stargate> = {}): Stargate {
    return {
      stargateId: 50001248,
      destination: { solarSystemId: 30000144, stargateId: 50001249 },
      position: { x: 1.5e12, y: 3.2e11, z: -8.7e11 },
      solarSystemId: 30000142,
      typeId: 16,
      ...overrides,
    };
  }

  static createStar(overrides: Partial<Star> = {}): Star {
    return {
      starId: 40009082,
      radius: 346600000,
      solarSystemId: 30000142,
      statistics: {
        age: 76000000000,
        life: 100000000000,
        luminosity: 0.02142,
        locked: false,
        spectralClass: 'K7 V',
        temperature: 4000,
      },
      typeId: 3796,
      ...overrides,
    };
  }

  static createPlanet(overrides: Partial<Planet> = {}): Planet {
    return {
      planetId: 40009077,
      asteroidBeltIDs: [40009079],
      attributes: {},
      celestialIndex: 1,
      moonIDs: [40009078],
      orbitId: 40009082,
      position: { x: 1.2e13, y: 1e11, z: -3.5e12 },
      radius: 2330000,
      solarSystemId: 30000142,
      statistics: {},
      typeId: 2015,
      npcStationIDs: null,
      ...overrides,
    };
  }

  static createMoon(overrides: Partial<Moon> = {}): Moon {
    return {
      moonId: 40009078,
      attributes: {},
      celestialIndex: 1,
      orbitId: 40009077,
      orbitIndex: 1,
      position: { x: 1.21e13, y: 1.01e11, z: -3.51e12 },
      radius: 240000,
      solarSystemId: 30000142,
      statistics: {},
      typeId: 14,
      npcStationIDs: null,
      ...overrides,
    };
  }

  static createAsteroidBelt(
    overrides: Partial<AsteroidBelt> = {},
  ): AsteroidBelt {
    return {
      asteroidBeltId: 40009079,
      celestialIndex: 1,
      orbitId: 40009077,
      orbitIndex: 1,
      position: { x: 1.19e13, y: 9.9e10, z: -3.49e12 },
      radius: 50000,
      solarSystemId: 30000142,
      statistics: {},
      typeId: 15,
      ...overrides,
    };
  }

  static createFaction(overrides: Partial<Faction> = {}): Faction {
    return {
      factionId: 500001,
      corporationId: 1000035,
      description: 'The Caldari State is a corporate dictatorship.',
      flatLogo: 'res:/ui/texture/corps/caldari.png',
      flatLogoWithName: 'res:/ui/texture/corps/caldari_name.png',
      iconId: 1439,
      memberRaces: [1],
      militiaCorporationId: 1000180,
      name: 'Caldari State',
      shortDescription: 'Caldari',
      sizeFactor: 5,
      solarSystemId: 30000142,
      uniqueName: true,
      ...overrides,
    };
  }

  static createRace(overrides: Partial<Race> = {}): Race {
    return {
      raceId: 1,
      description: 'The Caldari State is a corporate dictatorship.',
      iconId: 1439,
      name: 'Caldari',
      shipTypeId: 601,
      skills: {},
      ...overrides,
    };
  }

  static createBloodline(overrides: Partial<Bloodline> = {}): Bloodline {
    return {
      bloodlineId: 1,
      charisma: 3,
      corporationId: 1000006,
      description: 'The Deteis are regarded as the face of the Caldari State.',
      iconId: 1383,
      intelligence: 7,
      memory: 7,
      name: 'Deteis',
      perception: 5,
      raceId: 1,
      willpower: 5,
      ...overrides,
    };
  }

  static createAncestry(overrides: Partial<Ancestry> = {}): Ancestry {
    return {
      ancestryId: 1,
      bloodlineId: 1,
      charisma: 0,
      description: 'Born and raised in a capsule.',
      iconId: 1664,
      intelligence: 0,
      memory: 0,
      name: 'Tube Child',
      perception: 0,
      shortDescription: 'Raised in a capsule.',
      willpower: 2,
      ...overrides,
    };
  }

  static createNpcCorporation(
    overrides: Partial<NpcCorporation> = {},
  ): NpcCorporation {
    return {
      corporationId: 1000035,
      ceoId: 3004451,
      deleted: false,
      description: 'The Caldari Navy is the armed forces of the Caldari State.',
      extent: 'G',
      hasPlayerPersonnelManager: false,
      initialPrice: 0,
      memberLimit: 0,
      minSecurity: 0,
      minimumJoinStanding: 0,
      name: 'Caldari Navy',
      sendCharTerminationMessage: true,
      shares: 100000,
      size: 'H',
      stationId: 60003760,
      taxRate: 0,
      tickerName: 'CN',
      uniqueName: true,
      allowedMemberRaces: null,
      corporationTrades: null,
      divisions: null,
      enemyId: null,
      factionId: 500001,
      friendId: null,
      iconId: 1439,
      investors: null,
      lpOfferTables: null,
      mainActivityId: null,
      raceId: 1,
      sizeFactor: null,
      solarSystemId: 30000142,
      secondaryActivityId: null,
      ...overrides,
    };
  }

  static createNpcStation(overrides: Partial<NpcStation> = {}): NpcStation {
    return {
      stationId: 60003760,
      celestialIndex: 4,
      operationId: 1,
      orbitId: 40009081,
      orbitIndex: 4,
      ownerId: 1000035,
      position: { x: 1.58e14, y: 9.63e12, z: 1.06e14 },
      reprocessingEfficiency: 0.5,
      reprocessingHangarFlag: 4,
      reprocessingStationsTake: 0.05,
      solarSystemId: 30000142,
      typeId: 1529,
      useOperationName: true,
      ...overrides,
    };
  }

  static createMarketGroup(overrides: Partial<MarketGroup> = {}): MarketGroup {
    return {
      marketGroupId: 1857,
      description: 'Refined minerals used in manufacturing.',
      hasTypes: true,
      iconId: 22,
      name: 'Minerals',
      parentGroupId: 1031,
      ...overrides,
    };
  }

  static createMetaGroup(overrides: Partial<MetaGroup> = {}): MetaGroup {
    return {
      metaGroupId: 1,
      color: { r: 255, g: 255, b: 255, a: 255 },
      name: 'Tech I',
      iconId: null,
      iconSuffix: null,
      description: null,
      ...overrides,
    };
  }

  static createIcon(overrides: Partial<Icon> = {}): Icon {
    return {
      iconId: 22,
      iconFile: 'res:/UI/Texture/Icons/22_32_2.png',
      ...overrides,
    };
  }

  static createGraphic(overrides: Partial<Graphic> = {}): Graphic {
    return {
      graphicId: 20,
      graphicFile: 'res:/dx9/model/worldobject/asteroid/oreveld001.red',
      iconFolder: null,
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
      attributeCategoryId: 1,
      dataType: 2,
      defaultValue: 0,
      description: 'Hit points for a ship.',
      displayWhenZero: false,
      highIsGood: true,
      name: 'hp',
      published: true,
      stackable: false,
      displayName: null,
      iconId: null,
      tooltipDescription: null,
      tooltipTitle: null,
      unitId: 1,
      chargeRechargeTimeId: null,
      maxAttributeId: null,
      minAttributeId: null,
      ...overrides,
    };
  }

  static createDogmaEffect(overrides: Partial<DogmaEffect> = {}): DogmaEffect {
    return {
      effectId: 11,
      disallowAutoRepeat: false,
      dischargeAttributeId: 0,
      durationAttributeId: 0,
      effectCategoryId: 0,
      electronicChance: false,
      guid: 'effects.LowSlotModifier',
      isAssistance: false,
      isOffensive: false,
      isWarpSafe: true,
      name: 'lowSlotModifier',
      propulsionChance: false,
      published: true,
      rangeChance: false,
      distribution: null,
      falloffAttributeId: null,
      rangeAttributeId: null,
      trackingSpeedAttributeId: null,
      description: null,
      displayName: null,
      iconId: null,
      modifierInfo: null,
      ...overrides,
    };
  }

  static createBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
    return {
      activities: {
        manufacturing: {
          time: 6000,
          materials: [
            { typeId: 34, quantity: 100 },
            { typeId: 35, quantity: 50 },
          ],
          products: [{ typeId: 587, quantity: 1 }],
        },
      },
      blueprintTypeId: 787,
      maxProductionLimit: 10,
      ...overrides,
    };
  }

  static createPlanetSchematic(
    overrides: Partial<PlanetSchematic> = {},
  ): PlanetSchematic {
    return {
      planetSchematicId: 65,
      cycleTime: 1800,
      name: 'Bacteria',
      pins: [],
      types: [],
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
      solarSystemId: system1.systemId,
      destination: { solarSystemId: system2.systemId, stargateId: 50001249 },
    });

    const star = this.createStar({ solarSystemId: system1.systemId });
    const planet = this.createPlanet({ solarSystemId: system1.systemId });
    const moon = this.createMoon({ solarSystemId: system1.systemId });
    const asteroidBelt = this.createAsteroidBelt({
      solarSystemId: system1.systemId,
    });

    const race = this.createRace();
    const faction = this.createFaction({ memberRaces: [race.raceId] });
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
      ownerId: npcCorp.corporationId,
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
