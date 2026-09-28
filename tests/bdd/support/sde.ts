/**
 * What the SDE features (tests/bdd/features/sde) look up, and where the
 * answers come from. Step files open providers, build errors and walk record
 * chains through here; they construct nothing themselves.
 *
 * Every scenario reads the in-memory provider over the factory's hierarchical
 * data set, so the IDs below are that data set's: Tritanium in The Forge,
 * with the version record the factory stamps on it.
 */
import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';
import { MemorySdeProvider } from '../../../src/sde/MemorySdeProvider';
import type { MemorySdeData } from '../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import {
  SdeDatabaseError,
  SdeError,
  SdeValidationError,
  SdeVersionMismatchError,
  isSdeDatabaseError,
  isSdeError,
  isSdeValidationError,
  isSdeVersionMismatch,
} from '../../../src/sde/errors';
import { EveTypeSchema } from '../../../src/sde/schemas';
import type {
  AgentInSpace,
  AgentType,
  Certificate,
  CharacterAttribute,
  CloneGrade,
  Constellation,
  CorporationActivity,
  DogmaAttributeCategory,
  DogmaUnit,
  Dungeon,
  EpicArc,
  EveCategory,
  EveGroup,
  EveType,
  IndustryActivity,
  Landmark,
  Mission,
  NotificationType,
  NpcCharacter,
  NpcCorporationDivision,
  School,
  SecondarySun,
  Skin,
  SkinLicense,
  SolarSystem,
  StationOperation,
  StationService,
  TypeBonus,
  TypeDogma,
  TypeMaterial,
} from '../../../src/sde/types';
import type { World } from './world';

export const TRITANIUM = { typeId: 34, name: 'Tritanium', groupId: 18 };
export const MINERAL_GROUP_NAME = 'Mineral';
export const MATERIAL_CATEGORY_NAME = 'Material';
export const UNKNOWN_TYPE_ID = 999999;
export const THE_FORGE = 10000002;
export const KIMOTORO = 'Kimotoro';
export const JITA = { solarSystemId: 30000142, name: 'Jita' };
export const PERIMETER = { solarSystemId: 30000144, name: 'Perimeter' };

/** The version record the factory stamps on its hierarchical data set. */
export const HIERARCHICAL_VERSION = {
  version: '2024-01-15.1',
  buildDate: '2024-01-15T00:00:00Z',
  importedAt: '2024-01-16T12:00:00Z',
  checksum: 'abc123def456',
};

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/** Open the provider over the hierarchical data set and hand it to the scenario. */
export function openHierarchicalProvider(world: World): IStaticDataProvider {
  world.sde = new MemorySdeProvider(
    SdeTestDataFactory.createHierarchicalTestData(),
  );
  return world.sde;
}

// ---------------------------------------------------------------------------
// The extended data set (features 0008 to 0012)
// ---------------------------------------------------------------------------

/** Categories beside Material: one with a group but no types, one with no groups. */
export const SHIP_CATEGORY = { categoryId: 6, name: 'Ship' };
export const CELESTIAL_CATEGORY = { categoryId: 2, name: 'Celestial' };
export const FRIGATE_GROUP = { groupId: 25, name: 'Frigate' };
/** A second region with no constellations loaded. */
export const DOMAIN = { regionId: 10000043, name: 'Domain' };
/** A third Forge system, so a name search can match more than one. */
export const MAURASI = { solarSystemId: 30000148, name: 'Maurasi' };
export const ROOT_MARKET_GROUP = 1031;
export const MINERALS_MARKET_GROUP = 1857;

export const DOGMA_ATTRIBUTE_CATEGORIES: DogmaAttributeCategory[] = [
  {
    attributeCategoryId: 1,
    name: 'Fitting',
    description: 'Fitting capabilities of a ship',
  },
  {
    attributeCategoryId: 2,
    name: 'Shield',
    description: 'Shield attributes of a ship',
  },
];
export const DOGMA_UNITS: DogmaUnit[] = [
  { unitId: 1, name: 'Length', displayName: 'm', description: 'Meter' },
  { unitId: 3, name: 'Time', displayName: 's', description: 'Second' },
];
export const HI_SLOT_EFFECT = { effectId: 12, name: 'hiSlotModifier' };

/**
 * The hierarchical data set plus the records the classification, geography,
 * market and dogma features need: a second and third category, an empty
 * group, an empty region, a third system, two dogma attribute categories,
 * two units and a second effect.
 */
export function openExtendedProvider(world: World): IStaticDataProvider {
  world.sde = new MemorySdeProvider(extendedData());
  return world.sde;
}

function extendedData(): MemorySdeData {
  const data = SdeTestDataFactory.createHierarchicalTestData();
  const solarSystems = [
    ...(data.solarSystems ?? []),
    SdeTestDataFactory.createSolarSystem({
      systemId: MAURASI.solarSystemId,
      name: MAURASI.name,
      planetIDs: [],
    }),
  ];
  return {
    ...data,
    categories: [
      ...(data.categories ?? []),
      SdeTestDataFactory.createEveCategory(SHIP_CATEGORY),
      SdeTestDataFactory.createEveCategory(CELESTIAL_CATEGORY),
    ],
    groups: [
      ...(data.groups ?? []),
      SdeTestDataFactory.createEveGroup({
        ...FRIGATE_GROUP,
        categoryId: SHIP_CATEGORY.categoryId,
      }),
    ],
    regions: [
      ...(data.regions ?? []),
      SdeTestDataFactory.createRegion({ ...DOMAIN, constellationIDs: [] }),
    ],
    solarSystems,
    dogmaEffects: [
      ...(data.dogmaEffects ?? []),
      SdeTestDataFactory.createDogmaEffect(HI_SLOT_EFFECT),
    ],
    dogmaAttributeCategories: DOGMA_ATTRIBUTE_CATEGORIES,
    dogmaUnits: DOGMA_UNITS,
  };
}

/** Open a provider over no data at all, so only its defaults answer. */
export function openEmptyProvider(world: World): IStaticDataProvider {
  world.sde = new MemorySdeProvider();
  return world.sde;
}

/** The provider a Given step opened; a When step without one is a bug. */
export function sdeProvider(world: World): IStaticDataProvider {
  if (!world.sde) {
    throw new Error('No SDE provider is open; a Given step must open one.');
  }
  return world.sde;
}

// ---------------------------------------------------------------------------
// Record chains
// ---------------------------------------------------------------------------

export interface TypeChain {
  type: EveType | null;
  group: EveGroup | null;
  category: EveCategory | null;
}

/** Follow a type to its group and that group to its category. */
export function resolveTypeChain(
  provider: IStaticDataProvider,
  typeId: number,
): TypeChain {
  const type = provider.getType(typeId);
  const group = type ? provider.getGroup(type.groupId) : null;
  const category = group ? provider.getCategory(group.categoryId) : null;
  return { type, group, category };
}

export interface RegionDescent {
  constellations: Constellation[];
  /** The solar systems of the first constellation, or none. */
  systems: SolarSystem[];
}

/** Walk a region down to the systems of its first constellation. */
export function descendRegion(
  provider: IStaticDataProvider,
  regionId: number,
): RegionDescent {
  const region = provider.getRegion(regionId);
  const constellations = region
    ? provider.getConstellationsByRegion(region.regionId)
    : [];
  const first = constellations[0];
  const systems = first
    ? provider.getSolarSystemsByConstellation(first.constellationId)
    : [];
  return { constellations, systems };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** A record that fails EveTypeSchema on both of its typed fields. */
export const INVALID_EVE_TYPE: Record<string, unknown> = {
  typeId: 'not-a-number',
  name: 123,
};

/**
 * Validate a record as an EveType, wrapping a schema failure the way the
 * ingestion layer does: the entity type and ID travel with the error.
 */
export function validateEveType(
  data: Record<string, unknown>,
  entityId: number,
): SdeValidationError | null {
  try {
    EveTypeSchema.parse(data);
    return null;
  } catch (err) {
    return new SdeValidationError('EveType', err, entityId);
  }
}

/** One instance of every SDE error class, plus a plain Error for contrast. */
export function sdeErrorInstances() {
  return {
    base: new SdeError('base'),
    database: new SdeDatabaseError('db fail'),
    validation: new SdeValidationError('Type', 'bad'),
    mismatch: new SdeVersionMismatchError('2', '1'),
    plain: new Error('plain'),
  };
}

export type SdeErrorInstances = ReturnType<typeof sdeErrorInstances>;

/** Each guard's verdict on each instance, keyed guard then instance. */
export function applySdeGuards(
  instances: SdeErrorInstances,
): Record<string, Record<keyof SdeErrorInstances, boolean>> {
  const guards = {
    isSdeError,
    isSdeDatabaseError,
    isSdeValidationError,
    isSdeVersionMismatch,
  };
  const verdicts: Record<string, Record<keyof SdeErrorInstances, boolean>> = {};
  for (const [name, guard] of Object.entries(guards)) {
    verdicts[name] = {
      base: guard(instances.base),
      database: guard(instances.database),
      validation: guard(instances.validation),
      mismatch: guard(instances.mismatch),
      plain: guard(instances.plain),
    };
  }
  return verdicts;
}

/** What every guard shall say: its own class and subclasses only. */
export const EXPECTED_GUARD_VERDICTS = {
  isSdeError: {
    base: true,
    database: true,
    validation: true,
    mismatch: true,
    plain: false,
  },
  isSdeDatabaseError: {
    base: false,
    database: true,
    validation: false,
    mismatch: false,
    plain: false,
  },
  isSdeValidationError: {
    base: false,
    database: false,
    validation: true,
    mismatch: false,
    plain: false,
  },
  isSdeVersionMismatch: {
    base: false,
    database: false,
    validation: false,
    mismatch: true,
    plain: false,
  },
};

// ---------------------------------------------------------------------------
// The reference data set (features 0013 to 0019)
// ---------------------------------------------------------------------------

/** A second faction with no NPC corporations loaded, and its race. */
export const GALLENTE_FEDERATION = {
  factionId: 500004,
  name: 'Gallente Federation',
};
export const GALLENTE_RACE = { raceId: 8, name: 'Gallente' };
/** The factory's bloodline and ancestry, by the IDs the scenarios use. */
export const DETEIS = { bloodlineId: 1, name: 'Deteis', raceId: 1 };
export const TUBE_CHILD = { ancestryId: 1, name: 'Tube Child', bloodlineId: 1 };

/** The factory's NPC corporation, plus a second one in the same faction. */
export const CALDARI_NAVY = { corporationId: 1000035, name: 'Caldari Navy' };
export const CALDARI_PROVISIONS = {
  corporationId: 1000009,
  name: 'Caldari Provisions',
};
/** A second station, in Perimeter, owned by Caldari Provisions. */
export const PERIMETER_STATION = { stationId: 60003469 };

export const NPC_CHARACTERS: NpcCharacter[] = [
  npcCharacter(3004451, 'Aakiro Tenaka', CALDARI_NAVY.corporationId, true),
  npcCharacter(3004452, 'Toshi Aakari', CALDARI_NAVY.corporationId, false),
  npcCharacter(3004453, 'Pierre Duval', CALDARI_PROVISIONS.corporationId, true),
];

function npcCharacter(
  characterId: number,
  name: string,
  corporationId: number,
  ceo: boolean,
): NpcCharacter {
  return {
    characterId,
    bloodlineId: DETEIS.bloodlineId,
    ceo,
    corporationId,
    gender: 1,
    locationId: JITA.solarSystemId,
    name,
    raceId: DETEIS.raceId,
    startDate: '2003-05-06T00:00:00Z',
    uniqueName: true,
    skills: null,
    ancestryId: TUBE_CHILD.ancestryId,
    careerId: null,
    schoolId: null,
    specialityId: null,
  };
}

export const CHARACTER_ATTRIBUTES: CharacterAttribute[] = [
  {
    attributeId: 1,
    description: 'Ability to analyse and reason.',
    iconId: 1379,
    name: 'Intelligence',
    notes: '',
    shortDescription: 'Analysis',
  },
  {
    attributeId: 2,
    description: 'Ability to influence others.',
    iconId: 1378,
    name: 'Charisma',
    notes: '',
    shortDescription: 'Influence',
  },
];

export const CLONE_GRADES: CloneGrade[] = [
  { cloneGradeId: 1, name: 'Alpha Clone', skills: null },
  { cloneGradeId: 2, name: 'Omega Clone', skills: null },
];

export const SCHOOLS: School[] = [
  school(1, 'School of Applied Knowledge', 1000044),
  school(2, 'Science and Trade Institute', 1000045),
];

function school(schoolId: number, name: string, corporationId: number): School {
  return {
    schoolId,
    careerAgents: null,
    careerId: 1,
    characterDescription: '',
    corporationId,
    description: '',
    iconId: 1439,
    name,
    raceId: DETEIS.raceId,
    startingStations: null,
    title: name,
    isStarterSpaceSchool: null,
  };
}

export const CORPORATION_ACTIVITIES: CorporationActivity[] = [
  { corporationActivityId: 1, name: 'Warfare' },
  { corporationActivityId: 2, name: 'Security' },
];

export const NPC_CORPORATION_DIVISIONS: NpcCorporationDivision[] = [
  {
    npcCorporationDivisionId: 1,
    displayName: 'Accounting',
    internalName: 'accounting',
    leaderTypeName: 'CFO',
    name: 'Accounting',
    description: null,
  },
  {
    npcCorporationDivisionId: 2,
    displayName: 'Administration',
    internalName: 'administration',
    leaderTypeName: 'COO',
    name: 'Administration',
    description: null,
  },
];

export const AGENT_TYPES: AgentType[] = [
  { agentTypeId: 2, name: 'BasicAgent' },
  { agentTypeId: 3, name: 'TutorialAgent' },
];

/** One agent in space, in Jita; Maurasi has none. */
export const AGENT_IN_SPACE: AgentInSpace = {
  characterId: 3018681,
  dungeonId: 1,
  solarSystemId: JITA.solarSystemId,
  spawnPointId: 1,
  typeId: 3721,
};

export const TECH_II_META_GROUP = { metaGroupId: 2, name: 'Tech II' };

export const SKINS: Skin[] = [
  skin(1, 'Tristan Sanctuary'),
  skin(2, 'Tristan Blueprint'),
];

function skin(skinId: number, internalName: string): Skin {
  return {
    skinId,
    allowCCPDevs: false,
    internalName,
    skinMaterialId: 1,
    types: null,
    visibleSerenity: true,
    visibleTranquility: true,
    isStructureSkin: null,
  };
}

/** Two licences for skin 1; skin 2 has none. */
export const SKIN_LICENSES: SkinLicense[] = [
  { licenseTypeId: 34599, skinId: 1, duration: -1 },
  { licenseTypeId: 34600, skinId: 1, duration: 30 },
];

export const NOTIFICATION_TYPE: NotificationType = {
  notificationTypeId: 1,
  displayName: 'Old Notification',
  internalName: 'notificationTypeOldNotification',
};

export const LANDMARKS: Landmark[] = [
  landmark(1, 'EVE Gate'),
  landmark(2, 'Jita 4-4'),
];

function landmark(landmarkId: number, name: string): Landmark {
  return {
    landmarkId,
    description: '',
    name,
    position: { x: 0, y: 0, z: 0 },
    iconId: null,
    locationId: JITA.solarSystemId,
  };
}

/** One secondary sun, in Jita; Maurasi has none. */
export const SECONDARY_SUN: SecondarySun = {
  secondarySunId: 1,
  effectBeaconTypeId: 46760,
  position: { x: 0, y: 0, z: 0 },
  solarSystemId: JITA.solarSystemId,
  typeId: 46764,
};

export const STATION_OPERATIONS: StationOperation[] = [
  stationOperation(1, 'Manufacturing'),
  stationOperation(2, 'Refinery'),
];

function stationOperation(
  stationOperationId: number,
  operationName: string,
): StationOperation {
  return {
    stationOperationId,
    activityId: 1,
    border: 0,
    corridor: 0,
    description: '',
    fringe: 0,
    hub: 0,
    manufacturingFactor: 1,
    operationName,
    ratio: 1,
    researchFactor: 1,
    services: null,
    stationTypes: null,
  };
}

export const STATION_SERVICES: StationService[] = [
  { stationServiceId: 1, serviceName: 'Bounty Missions', description: null },
  {
    stationServiceId: 2,
    serviceName: 'Assassination Missions',
    description: null,
  },
];

export const INDUSTRY_ACTIVITIES: IndustryActivity[] = [
  { industryActivityId: 1, description: '', name: 'Manufacturing' },
  { industryActivityId: 3, description: '', name: 'Time Efficiency Research' },
];

export const BIOFUELS_SCHEMATIC = { planetSchematicId: 66, name: 'Biofuels' };

export const CERTIFICATES: Certificate[] = [
  certificate(50, 'Core Fitting'),
  certificate(51, 'Core Navigation'),
];

function certificate(certificateId: number, name: string): Certificate {
  return {
    certificateId,
    description: '',
    groupId: 1,
    name,
    recommendedFor: null,
    skillTypes: null,
  };
}

/** The three type extension tables, each keyed by a type ID. */
export const TRITANIUM_DOGMA: TypeDogma = {
  typeId: TRITANIUM.typeId,
  dogmaAttributes: [{ attributeId: 9, value: 1 }],
  dogmaEffects: [],
};
export const TRITANIUM_MATERIAL: TypeMaterial = {
  typeId: TRITANIUM.typeId,
  materials: [{ materialTypeId: 35, quantity: 1 }],
};
export const IBIS = 601;
export const IBIS_BONUS: TypeBonus = {
  typeId: IBIS,
  roleBonuses: [{ bonusText: 'Immune to weapon disruption' }],
  types: null,
};

export const MISSION: Mission = {
  missionId: 1,
  hasStandingRewards: true,
  killMission: null,
  messages: null,
  name: 'Cash Flow for Capsuleers',
  expirationTime: null,
  factionId: null,
};
export const DUNGEON: Dungeon = {
  dungeonId: 1,
  allowedShipsList: null,
  archetypeId: 1,
  description: '',
  factionId: GALLENTE_FEDERATION.factionId,
  name: 'Cash Flow Dungeon',
};
export const EPIC_ARCS: EpicArc[] = [
  epicArc(1, 'The Blood-Stained Stars', 500001),
  epicArc(2, 'Penumbra', 500001),
];

function epicArc(epicArcId: number, name: string, factionId: number): EpicArc {
  return {
    epicArcId,
    arcRestartInterval: 90,
    factionId,
    iconId: 1439,
    missions: null,
    name,
  };
}

/**
 * The extended data set plus one or two records of every remaining family:
 * a second faction and race, NPC organisations and their people, the
 * presentation, station and industry reference tables, the type extension
 * tables and the mission content.
 */
export function openReferenceProvider(world: World): IStaticDataProvider {
  const data = extendedData();
  world.sde = new MemorySdeProvider({
    ...data,
    factions: [
      ...(data.factions ?? []),
      SdeTestDataFactory.createFaction({
        ...GALLENTE_FEDERATION,
        memberRaces: [GALLENTE_RACE.raceId],
        corporationId: 1000125,
        solarSystemId: 30002187,
      }),
    ],
    races: [
      ...(data.races ?? []),
      SdeTestDataFactory.createRace(GALLENTE_RACE),
    ],
    npcCorporations: [
      ...(data.npcCorporations ?? []),
      SdeTestDataFactory.createNpcCorporation({
        ...CALDARI_PROVISIONS,
        ceoId: 3004453,
        stationId: PERIMETER_STATION.stationId,
        tickerName: 'CP',
      }),
    ],
    npcStations: [
      ...(data.npcStations ?? []),
      SdeTestDataFactory.createNpcStation({
        ...PERIMETER_STATION,
        solarSystemId: PERIMETER.solarSystemId,
        ownerId: CALDARI_PROVISIONS.corporationId,
      }),
    ],
    metaGroups: [
      ...(data.metaGroups ?? []),
      SdeTestDataFactory.createMetaGroup(TECH_II_META_GROUP),
    ],
    planetSchematics: [
      ...(data.planetSchematics ?? []),
      SdeTestDataFactory.createPlanetSchematic(BIOFUELS_SCHEMATIC),
    ],
    npcCharacters: NPC_CHARACTERS,
    characterAttributes: CHARACTER_ATTRIBUTES,
    cloneGrades: CLONE_GRADES,
    schools: SCHOOLS,
    corporationActivities: CORPORATION_ACTIVITIES,
    npcCorporationDivisions: NPC_CORPORATION_DIVISIONS,
    agentTypes: AGENT_TYPES,
    agentsInSpace: [AGENT_IN_SPACE],
    skins: SKINS,
    skinLicenses: SKIN_LICENSES,
    notificationTypes: [NOTIFICATION_TYPE],
    landmarks: LANDMARKS,
    secondarySuns: [SECONDARY_SUN],
    stationOperations: STATION_OPERATIONS,
    stationServices: STATION_SERVICES,
    industryActivities: INDUSTRY_ACTIVITIES,
    certificates: CERTIFICATES,
    typeDogma: [TRITANIUM_DOGMA],
    typeMaterials: [TRITANIUM_MATERIAL],
    typeBonuses: [IBIS_BONUS],
    missions: [MISSION],
    dungeons: [DUNGEON],
    epicArcs: EPIC_ARCS,
  });
  return world.sde;
}
