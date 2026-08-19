import { z } from 'zod';

// ===================================================================
// Sub-interface schemas
// ===================================================================

export const Position3DSchema = z.looseObject({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const Position2DSchema = z.looseObject({
  x: z.number(),
  y: z.number(),
});

export const StarStatisticsSchema = z.looseObject({
  age: z.number(),
  life: z.number(),
  luminosity: z.number(),
  locked: z.boolean(),
  spectralClass: z.string(),
  temperature: z.number(),
});

export const StargateDestinationSchema = z.looseObject({
  solarSystemId: z.number().int(),
  stargateId: z.number().int(),
});

export const BlueprintMaterialSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
});

export const BlueprintProductSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
  probability: z.number().optional(),
});

export const BlueprintActivitySchema = z.looseObject({
  time: z.number().int(),
  materials: z.array(BlueprintMaterialSchema).optional(),
  products: z.array(BlueprintProductSchema).optional(),
});

export const BlueprintActivitiesSchema = z.looseObject({
  manufacturing: BlueprintActivitySchema.optional(),
  research_material: BlueprintActivitySchema.optional(),
  research_time: BlueprintActivitySchema.optional(),
  copying: BlueprintActivitySchema.optional(),
  invention: BlueprintActivitySchema.optional(),
});

// ===================================================================
// Entity schemas (ordered by table name)
// ===================================================================

export const AccountingEntryTypeSchema = z.looseObject({
  accountingEntryTypeId: z.number().int(),
  internalName: z.string(),
  name: z.string(),
  journalMessage: z.string().nullable(),
  description: z.string().nullable(),
});

export const AgentTypeSchema = z.looseObject({
  agentTypeId: z.number().int(),
  name: z.string(),
});

export const AgentInSpaceSchema = z.looseObject({
  characterId: z.number().int(),
  dungeonId: z.number().int(),
  solarSystemId: z.number().int(),
  spawnPointId: z.number().int(),
  typeId: z.number().int(),
});

export const AncestrySchema = z.looseObject({
  ancestryId: z.number().int(),
  bloodlineId: z.number().int(),
  charisma: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  intelligence: z.number().int(),
  memory: z.number().int(),
  name: z.string(),
  perception: z.number().int(),
  shortDescription: z.string(),
  willpower: z.number().int(),
});

export const AppliedProximityEffectSchema = z.looseObject({
  appliedProximityEffectId: z.number().int(),
  dbuffs: z.unknown(),
  delaySeconds: z.number().int(),
  radius: z.number().int(),
});

export const ArchetypeSchema = z.looseObject({
  archetypeId: z.number().int(),
  description: z.string(),
  title: z.string(),
});

export const AsteroidBeltSchema = z.looseObject({
  asteroidBeltId: z.number().int(),
  celestialIndex: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
});

export const BloodlineSchema = z.looseObject({
  bloodlineId: z.number().int(),
  charisma: z.number().int(),
  corporationId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  intelligence: z.number().int(),
  memory: z.number().int(),
  name: z.string(),
  perception: z.number().int(),
  raceId: z.number().int(),
  willpower: z.number().int(),
});

export const BlueprintSchema = z.looseObject({
  activities: BlueprintActivitiesSchema,
  blueprintTypeId: z.number().int(),
  maxProductionLimit: z.number().int(),
});

export const EveCategorySchema = z.looseObject({
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
  iconId: z.number().int().nullable(),
});

export const CertificateSchema = z.looseObject({
  certificateId: z.number().int(),
  description: z.string(),
  groupId: z.number().int(),
  name: z.string(),
  recommendedFor: z.unknown(),
  skillTypes: z.unknown(),
});

export const CharacterAttributeSchema = z.looseObject({
  attributeId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  notes: z.string(),
  shortDescription: z.string(),
});

export const CharacterTitleSchema = z.looseObject({
  name: z.string(),
});

export const CloneGradeSchema = z.looseObject({
  cloneGradeId: z.number().int(),
  name: z.string(),
  skills: z.unknown(),
});

export const CompressibleTypeSchema = z.looseObject({
  typeId: z.number().int(),
  compressedTypeId: z.number().int(),
});

export const ConstellationSchema = z.looseObject({
  constellationId: z.number().int(),
  factionId: z.number().int(),
  name: z.string(),
  position: Position3DSchema,
  regionId: z.number().int(),
  solarSystemIDs: z.array(z.number().int()),
  wormholeClassId: z.number().int(),
});

export const ContrabandTypeSchema = z.looseObject({
  typeId: z.number().int(),
  factions: z.unknown(),
});

export const ControlTowerResourceSchema = z.looseObject({
  typeId: z.number().int(),
  resources: z.unknown(),
});

export const CorporationActivitySchema = z.looseObject({
  corporationActivityId: z.number().int(),
  name: z.string(),
});

export const CorporationRoleGroupSchema = z.looseObject({
  corporationRoleGroupId: z.number().int(),
  appliesTo: z.string(),
  appliesToGrantable: z.string(),
  isDivisional: z.boolean(),
  isLocational: z.boolean(),
  name: z.string(),
});

export const CorporationRoleSchema = z.looseObject({
  corporationRoleId: z.number().int(),
  description: z.string(),
  name: z.string(),
  roleGroupIDs: z.unknown(),
  shortName: z.string(),
});

export const DbuffCollectionSchema = z.looseObject({
  dbuffCollectionId: z.number().int(),
  aggregateMode: z.string(),
  developerDescription: z.unknown(),
  itemModifiers: z.unknown(),
  locationGroupModifiers: z.unknown(),
  locationModifiers: z.unknown(),
  locationRequiredSkillModifiers: z.unknown(),
  operationName: z.string(),
  showOutputValueInUI: z.string(),
  displayName: z.string().nullable(),
});

export const DogmaAttributeCategorySchema = z.looseObject({
  attributeCategoryId: z.number().int(),
  description: z.string(),
  name: z.string(),
});

export const DogmaAttributeSchema = z.looseObject({
  attributeId: z.number().int(),
  attributeCategoryId: z.number().int(),
  dataType: z.number().int(),
  defaultValue: z.number(),
  description: z.string(),
  displayWhenZero: z.boolean(),
  highIsGood: z.boolean(),
  name: z.string(),
  published: z.boolean(),
  stackable: z.boolean(),
  displayName: z.string().nullable(),
  iconId: z.number().int().nullable(),
  tooltipDescription: z.string().nullable(),
  tooltipTitle: z.string().nullable(),
  unitId: z.number().int().nullable(),
  chargeRechargeTimeId: z.number().int().nullable(),
  maxAttributeId: z.number().int().nullable(),
  minAttributeId: z.number().int().nullable(),
});

export const DogmaEffectSchema = z.looseObject({
  effectId: z.number().int(),
  disallowAutoRepeat: z.boolean(),
  dischargeAttributeId: z.number().int(),
  durationAttributeId: z.number().int(),
  effectCategoryId: z.number().int(),
  electronicChance: z.boolean(),
  guid: z.string(),
  isAssistance: z.boolean(),
  isOffensive: z.boolean(),
  isWarpSafe: z.boolean(),
  name: z.string(),
  propulsionChance: z.boolean(),
  published: z.boolean(),
  rangeChance: z.boolean(),
  distribution: z.string().nullable(),
  falloffAttributeId: z.number().int().nullable(),
  rangeAttributeId: z.number().int().nullable(),
  trackingSpeedAttributeId: z.number().int().nullable(),
  description: z.string().nullable(),
  displayName: z.string().nullable(),
  iconId: z.number().int().nullable(),
  modifierInfo: z.unknown().nullable(),
});

export const DogmaUnitSchema = z.looseObject({
  unitId: z.number().int(),
  description: z.string(),
  displayName: z.string(),
  name: z.string(),
});

export const DungeonSchema = z.looseObject({
  dungeonId: z.number().int(),
  allowedShipsList: z.unknown(),
  archetypeId: z.number().int(),
  description: z.string(),
  factionId: z.number().int(),
  name: z.string(),
});

export const DynamicItemAttributeSchema = z.looseObject({
  dynamicItemAttributeId: z.number().int(),
  attributeIDs: z.unknown(),
  inputOutputMapping: z.unknown(),
});

export const EpicArcSchema = z.looseObject({
  epicArcId: z.number().int(),
  arcRestartInterval: z.number().int(),
  factionId: z.number().int(),
  iconId: z.number().int(),
  missions: z.unknown(),
  name: z.string(),
});

export const ExpertSystemSchema = z.looseObject({
  expertSystemId: z.number().int(),
  durationDays: z.number().int(),
  hidden: z.boolean(),
  internalName: z.string(),
  retired: z.boolean(),
  skillsGranted: z.unknown(),
  associatedShipTypes: z.unknown().nullable(),
});

export const FactionSchema = z.looseObject({
  factionId: z.number().int(),
  corporationId: z.number().int(),
  description: z.string(),
  flatLogo: z.string(),
  flatLogoWithName: z.string(),
  iconId: z.number().int(),
  memberRaces: z.array(z.number().int()),
  militiaCorporationId: z.number().int(),
  name: z.string(),
  shortDescription: z.string(),
  sizeFactor: z.number(),
  solarSystemId: z.number().int(),
  uniqueName: z.boolean(),
});

export const FighterAbilitySchema = z.looseObject({
  fighterAbilityId: z.number().int(),
  disallowInHighSec: z.boolean(),
  disallowInLowSec: z.boolean(),
  displayName: z.string(),
  iconId: z.number().int(),
  targetMode: z.string(),
  tooltipText: z.string().nullable(),
  turretGraphicId: z.number().int().nullable(),
});

export const FighterAbilityByTypeSchema = z.looseObject({
  typeId: z.number().int(),
  abilitySlot0: z.unknown(),
  abilitySlot1: z.unknown(),
  abilitySlot2: z.unknown(),
});

export const FreelanceJobSchemaSchema = z.looseObject({
  freelanceJobSchemaGroupId: z.number().int(),
  BoostShield: z.unknown(),
  CaptureFWComplex: z.unknown(),
  DamageShip: z.unknown(),
  DefendFWComplex: z.unknown(),
  DeliverItem: z.unknown(),
  KillCapsuleer: z.unknown(),
  KillNPC: z.unknown(),
  MineOre: z.unknown(),
  RepairArmor: z.unknown(),
  ShipInsurance: z.unknown(),
});

export const GraphicMaterialSetSchema = z.looseObject({
  materialSetId: z.number().int(),
  colorHull: z.unknown(),
  colorPrimary: z.unknown(),
  colorSecondary: z.unknown(),
  colorWindow: z.unknown(),
  description: z.string(),
  sofFactionName: z.string(),
  sofRaceHint: z.string(),
  material1: z.string().nullable(),
  material2: z.string().nullable(),
  material3: z.string().nullable(),
  material4: z.string().nullable(),
  custommaterial1: z.string().nullable(),
  custommaterial2: z.string().nullable(),
  sofPatternName: z.string().nullable(),
});

export const GraphicSchema = z.looseObject({
  graphicId: z.number().int(),
  graphicFile: z.string(),
  iconFolder: z.string().nullable(),
  sofFactionName: z.string().nullable(),
  sofHullName: z.string().nullable(),
  sofRaceName: z.string().nullable(),
});

export const EveGroupSchema = z.looseObject({
  groupId: z.number().int(),
  anchorable: z.boolean(),
  anchored: z.boolean(),
  categoryId: z.number().int(),
  fittableNonSingleton: z.boolean(),
  name: z.string(),
  published: z.boolean(),
  useBasePrice: z.boolean(),
  iconId: z.number().int().nullable(),
});

export const IconSchema = z.looseObject({
  iconId: z.number().int(),
  iconFile: z.string(),
});

export const IndustryActivitySchema = z.looseObject({
  industryActivityId: z.number().int(),
  description: z.string(),
  name: z.string(),
});

export const IndustryAssemblyLineSchema = z.looseObject({
  assemblyLineId: z.number().int(),
  activityId: z.number().int(),
  baseMaterialMultiplier: z.number(),
  baseTimeMultiplier: z.number(),
  description: z.string(),
  name: z.string(),
  detailsPerGroup: z.unknown().nullable(),
  baseCostMultiplier: z.number().nullable(),
  detailsPerCategory: z.unknown().nullable(),
});

export const IndustryInstallationTypeSchema = z.looseObject({
  installationTypeId: z.number().int(),
  assemblyLines: z.unknown(),
});

export const IndustryModifierSourceSchema = z.looseObject({
  modifierSourceId: z.number().int(),
  copying: z.unknown(),
  invention: z.unknown(),
  manufacturing: z.unknown(),
  researchMaterial: z.unknown(),
  researchTime: z.unknown(),
  reaction: z.unknown().nullable(),
});

export const IndustryTargetFilterSchema = z.looseObject({
  targetFilterId: z.number().int(),
  categoryIDs: z.unknown(),
  name: z.string(),
  groupIDs: z.unknown().nullable(),
});

export const LandmarkSchema = z.looseObject({
  landmarkId: z.number().int(),
  description: z.string(),
  name: z.string(),
  position: Position3DSchema,
  iconId: z.number().int().nullable(),
  locationId: z.number().int().nullable(),
});

export const LinkWithShipSchema = z.looseObject({
  linkWithShipId: z.number().int(),
  applyPvpFlag: z.boolean(),
  canRelink: z.boolean(),
  characterEnergyCost: z.number().int(),
  dbuffPostLinkDuration: z.number().int(),
  dbuffs: z.unknown(),
  generateCynoInhibitor: z.boolean(),
  keepDbuffDurationOnLinkBreak: z.boolean(),
  linkDuration: z.number().int(),
  linkEffectGraphicIdOverride: z.number().int(),
  linkableShipTypeListId: z.number().int(),
  maxLinkRange: z.number().int(),
  omegaOnly: z.boolean(),
  solarsystemInterferenceCost: z.number().int(),
});

export const MarketGroupSchema = z.looseObject({
  marketGroupId: z.number().int(),
  description: z.string(),
  hasTypes: z.boolean(),
  iconId: z.number().int(),
  name: z.string(),
  parentGroupId: z.number().int().nullable(),
});

export const MasterySchema = z.looseObject({
  typeId: z.number().int(),
  '0': z.unknown(),
  '1': z.unknown(),
  '2': z.unknown(),
  '3': z.unknown(),
  '4': z.unknown(),
});

export const MercenaryTacticalOperationSchema = z.looseObject({
  mercenaryTacticalOperationId: z.number().int(),
  anarchyImpact: z.number().int(),
  description: z.string(),
  developmentImpact: z.number().int(),
  dungeonId: z.number().int(),
  infomorphBonus: z.number().int(),
  name: z.string(),
});

export const MetaGroupSchema = z.looseObject({
  metaGroupId: z.number().int(),
  color: z.unknown(),
  name: z.string(),
  iconId: z.number().int().nullable(),
  iconSuffix: z.string().nullable(),
  description: z.string().nullable(),
});

export const MetenoxMoonDrillSchema = z.looseObject({
  metenoxMoonDrillId: z.number().int(),
  miningCycleTime: z.number().int(),
  miningEfficiency: z.number(),
  reagentsConsumedPerCycle: z.number().int(),
});

export const MilitaryCampaignObjectiveSchema = z.looseObject({
  militaryCampaignObjectiveId: z.string(),
  campaignId: z.string(),
  careerPath: z.string(),
  contentTags: z.unknown(),
  contributionMethodConfiguration: z.unknown(),
  issuer: z.unknown(),
  maxProgressPerParticipant: z.number().int(),
  presentingCharacterId: z.number().int(),
  rewards: z.unknown(),
  subtitle: z.string(),
  targetProgress: z.number().int(),
  title: z.string(),
  annotations: z.unknown().nullable(),
});

export const MilitaryCampaignSchema = z.looseObject({
  militaryCampaignId: z.string(),
  annotations: z.unknown(),
  issuer: z.unknown(),
  subtitle: z.string(),
  targetProgress: z.number().int(),
  title: z.string(),
});

export const MissionSchema = z.looseObject({
  missionId: z.number().int(),
  hasStandingRewards: z.boolean(),
  killMission: z.unknown(),
  messages: z.unknown(),
  name: z.string(),
  expirationTime: z.string().nullable(),
  factionId: z.number().int().nullable(),
});

export const MoonSchema = z.looseObject({
  moonId: z.number().int(),
  attributes: z.unknown(),
  celestialIndex: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
  npcStationIDs: z.array(z.number().int()).nullable(),
});

export const NotificationTypeSchema = z.looseObject({
  notificationTypeId: z.number().int(),
  displayName: z.string(),
  internalName: z.string(),
});

export const NpcCharacterSchema = z.looseObject({
  characterId: z.number().int(),
  bloodlineId: z.number().int(),
  ceo: z.boolean(),
  corporationId: z.number().int(),
  gender: z.number().int(),
  locationId: z.number().int(),
  name: z.string(),
  raceId: z.number().int(),
  startDate: z.string(),
  uniqueName: z.boolean(),
  skills: z.unknown().nullable(),
  ancestryId: z.number().int().nullable(),
  careerId: z.number().int().nullable(),
  schoolId: z.number().int().nullable(),
  specialityId: z.number().int().nullable(),
});

export const NpcCorporationDivisionSchema = z.looseObject({
  npcCorporationDivisionId: z.number().int(),
  displayName: z.string(),
  internalName: z.string(),
  leaderTypeName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

export const NpcCorporationSchema = z.looseObject({
  corporationId: z.number().int(),
  ceoId: z.number().int(),
  deleted: z.boolean(),
  description: z.string(),
  extent: z.string(),
  hasPlayerPersonnelManager: z.boolean(),
  initialPrice: z.number(),
  memberLimit: z.number().int(),
  minSecurity: z.number(),
  minimumJoinStanding: z.number(),
  name: z.string(),
  sendCharTerminationMessage: z.boolean(),
  shares: z.number(),
  size: z.string(),
  stationId: z.number().int(),
  taxRate: z.number(),
  tickerName: z.string(),
  uniqueName: z.boolean(),
  allowedMemberRaces: z.unknown().nullable(),
  corporationTrades: z.unknown().nullable(),
  divisions: z.unknown().nullable(),
  enemyId: z.number().int().nullable(),
  factionId: z.number().int().nullable(),
  friendId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  investors: z.unknown().nullable(),
  lpOfferTables: z.unknown().nullable(),
  mainActivityId: z.number().int().nullable(),
  raceId: z.number().int().nullable(),
  sizeFactor: z.number().nullable(),
  solarSystemId: z.number().int().nullable(),
  secondaryActivityId: z.number().int().nullable(),
});

export const NpcStationSchema = z.looseObject({
  stationId: z.number().int(),
  celestialIndex: z.number().int(),
  operationId: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  ownerId: z.number().int(),
  position: Position3DSchema,
  reprocessingEfficiency: z.number(),
  reprocessingHangarFlag: z.number().int(),
  reprocessingStationsTake: z.number(),
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
  useOperationName: z.boolean(),
});

export const PlanetResourceSchema = z.looseObject({
  planetId: z.number().int(),
  power: z.number().int(),
  workforce: z.number().int().nullable(),
  reagent: z.unknown().nullable(),
});

export const PlanetSchematicSchema = z.looseObject({
  planetSchematicId: z.number().int(),
  cycleTime: z.number().int(),
  name: z.string(),
  pins: z.unknown(),
  types: z.unknown(),
});

export const PlanetSchema = z.looseObject({
  planetId: z.number().int(),
  asteroidBeltIDs: z.array(z.number().int()),
  attributes: z.unknown(),
  celestialIndex: z.number().int(),
  moonIDs: z.array(z.number().int()),
  orbitId: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
  npcStationIDs: z.array(z.number().int()).nullable(),
});

export const ProximityTrapSchema = z.looseObject({
  proximityTrapId: z.number().int(),
  dbuffDuration: z.number().int(),
  showPerimeterLights: z.boolean(),
  triggerDelay: z.number().int(),
  triggerFilterTypeListId: z.number().int(),
  triggerRange: z.number().int(),
  dbuffs: z.unknown().nullable(),
  forceDecloakDuration: z.number().int().nullable(),
  resetDelay: z.number().int().nullable(),
});

export const RaceSchema = z.looseObject({
  raceId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  shipTypeId: z.number().int(),
  skills: z.unknown(),
});

export const RegionSchema = z.looseObject({
  regionId: z.number().int(),
  constellationIDs: z.array(z.number().int()),
  description: z.string(),
  factionId: z.number().int(),
  name: z.string(),
  nebulaId: z.number().int(),
  position: Position3DSchema,
  wormholeClassId: z.number().int(),
});

export const SchoolMapSchema = z.looseObject({
  schoolMapId: z.number().int(),
  schoolId: z.number().int(),
  solarSystemId: z.number().int(),
});

export const SchoolSchema = z.looseObject({
  schoolId: z.number().int(),
  careerAgents: z.unknown(),
  careerId: z.number().int(),
  characterDescription: z.string(),
  corporationId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  raceId: z.number().int(),
  startingStations: z.unknown(),
  title: z.string(),
  isStarterSpaceSchool: z.string().nullable(),
});

export const SecondarySunSchema = z.looseObject({
  secondarySunId: z.number().int(),
  effectBeaconTypeId: z.number().int(),
  position: Position3DSchema,
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
});

export const ShipTreeElementSchema = z.looseObject({
  shipTreeElementId: z.number().int(),
  description: z.string(),
  icon: z.string(),
  name: z.string(),
});

export const ShipTreeFactionSchema = z.looseObject({
  factionId: z.number().int(),
  description: z.string(),
  elements: z.unknown(),
  icon: z.string(),
});

export const ShipTreeGroupSchema = z.looseObject({
  shipTreeGroupId: z.number().int(),
  description: z.string(),
  elements: z.unknown(),
  icon: z.string(),
  iconLarge: z.string(),
  iconSmall: z.string(),
  iconSmallNPC: z.string(),
  name: z.string(),
  preReqSkills: z.unknown(),
});

export const SkillPlanSchema = z.looseObject({
  skillPlanId: z.number().int(),
  careerPathId: z.number().int(),
  description: z.string(),
  factionId: z.number().int(),
  internalName: z.string(),
  milestones: z.unknown(),
  name: z.string(),
  skillRequirements: z.unknown(),
  npcCorporationDivision: z.string().nullable(),
});

export const SkinLicenseSchema = z.looseObject({
  duration: z.number().int(),
  licenseTypeId: z.number().int(),
  skinId: z.number().int(),
});

export const SkinMaterialSchema = z.looseObject({
  displayName: z.string(),
  materialSetId: z.number().int(),
});

export const SkinrComponentCategorySchema = z.looseObject({
  skinrComponentCategoryId: z.number().int(),
  name: z.string(),
});

export const SkinrComponentPointValueSchema = z.looseObject({
  '1': z.number().int(),
  '2': z.number().int(),
  '3': z.number().int(),
  '4': z.number().int(),
  '5': z.number().int(),
  '6': z.number().int(),
});

export const SkinrComponentRaritySchema = z.looseObject({
  skinrComponentRarityId: z.number().int(),
  name: z.string(),
  rank: z.number().int(),
});

export const SkinrComponentSchema = z.looseObject({
  skinrComponentId: z.number().int(),
  associatedTypeIds: z.unknown(),
  category: z.number().int(),
  finish: z.string(),
  iconFile: z.string(),
  name: z.string(),
  projectionTypeU: z.string(),
  projectionTypeV: z.string(),
  published: z.boolean(),
  rarity: z.number().int(),
  resourceFile: z.string(),
  sequenceBinder: z.unknown(),
});

export const SkinrSlotCategorySchema = z.looseObject({
  skinrSlotCategoryId: z.number().int(),
  name: z.string(),
});

export const SkinrSlotConfigurationSchema = z.looseObject({
  skinrSlotConfigurationId: z.number().int(),
  allowAllShips: z.boolean(),
  config: z.unknown(),
  name: z.string(),
  priority: z.number().int(),
  ships: z.unknown().nullable(),
});

export const SkinrSlotNameSchema = z.looseObject({
  skinrSlotNameId: z.number().int(),
  name: z.string(),
});

export const SkinrSlotSchema = z.looseObject({
  skinrSlotId: z.number().int(),
  allowedDesignComponentCategories: z.unknown(),
  category: z.number().int(),
  name: z.string(),
});

export const SkinrSlotToMaterialSchema = z.looseObject({
  skinrSlotToMaterialId: z.number().int(),
  '0': z.unknown(),
  '1': z.unknown(),
  '2': z.unknown(),
  '3': z.unknown(),
});

export const SkinrTierThresholdSchema = z.looseObject({
  '1': z.number().int(),
  '2': z.number().int(),
  '3': z.number().int(),
  '4': z.number().int(),
  '5': z.number().int(),
  '6': z.number().int(),
  '7': z.number().int(),
  '8': z.number().int(),
  '9': z.number().int(),
  '10': z.number().int(),
  '11': z.number().int(),
  '12': z.number().int(),
  '13': z.number().int(),
  '14': z.number().int(),
  '15': z.number().int(),
  '16': z.number().int(),
  '17': z.number().int(),
  '18': z.number().int(),
  '19': z.number().int(),
});

export const SkinSchema = z.looseObject({
  skinId: z.number().int(),
  allowCCPDevs: z.boolean(),
  internalName: z.string(),
  skinMaterialId: z.number().int(),
  types: z.unknown(),
  visibleSerenity: z.boolean(),
  visibleTranquility: z.boolean(),
  isStructureSkin: z.string().nullable(),
});

export const SolarSystemSchema = z.looseObject({
  systemId: z.number().int(),
  border: z.boolean(),
  constellationId: z.number().int(),
  hub: z.boolean(),
  international: z.boolean(),
  luminosity: z.number(),
  name: z.string(),
  planetIDs: z.array(z.number().int()),
  position: Position3DSchema,
  position2D: Position2DSchema,
  radius: z.number(),
  regionId: z.number().int(),
  regional: z.boolean(),
  securityClass: z.string(),
  securityStatus: z.number(),
  starId: z.number().int(),
  stargateIDs: z.array(z.number().int()),
  corridor: z.boolean().nullable(),
  fringe: z.boolean().nullable(),
  wormholeClassId: z.number().int().nullable(),
  visualEffect: z.string().nullable(),
});

export const SovereigntyUpgradeSchema = z.looseObject({
  typeId: z.number().int(),
  fuel: z.unknown(),
  mutually_exclusive_group: z.string(),
  power_allocation: z.number().int(),
  workforce_allocation: z.number().int(),
  power_production: z.number().int().nullable(),
  workforce_production: z.number().int().nullable(),
});

export const StargateSchema = z.looseObject({
  stargateId: z.number().int(),
  destination: StargateDestinationSchema,
  position: Position3DSchema,
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
});

export const StarSchema = z.looseObject({
  starId: z.number().int(),
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: StarStatisticsSchema,
  typeId: z.number().int(),
});

export const StationOperationSchema = z.looseObject({
  stationOperationId: z.number().int(),
  activityId: z.number().int(),
  border: z.number(),
  corridor: z.number(),
  description: z.string(),
  fringe: z.number(),
  hub: z.number(),
  manufacturingFactor: z.number(),
  operationName: z.string(),
  ratio: z.number(),
  researchFactor: z.number(),
  services: z.unknown(),
  stationTypes: z.unknown(),
});

export const StationServiceSchema = z.looseObject({
  stationServiceId: z.number().int(),
  serviceName: z.string(),
  description: z.string().nullable(),
});

export const StationStandingsRestrictionSchema = z.looseObject({
  stationStandingsRestrictionId: z.number().int(),
  services: z.unknown(),
});

export const SystemDbuffEmitterSchema = z.looseObject({
  systemDbuffEmitterId: z.number().int(),
  dbuffs: z.unknown(),
  duration: z.number().int(),
  excludeProtected: z.boolean(),
  interval: z.number().int(),
});

export const SystemWideEffectSchema = z.looseObject({
  systemWideEffectId: z.number().int(),
  dbuffs: z.unknown(),
  eligibleTypeListId: z.number().int(),
  environmentTypeId: z.number().int().nullable(),
});

export const TranslationLanguageSchema = z.looseObject({
  translationLanguageId: z.string(),
  name: z.string(),
});

export const TypeBonusSchema = z.looseObject({
  typeId: z.number().int(),
  roleBonuses: z.unknown(),
  types: z.unknown(),
});

export const TypeDogmaSchema = z.looseObject({
  typeId: z.number().int(),
  dogmaAttributes: z.unknown(),
  dogmaEffects: z.unknown().nullable(),
});

export const TypeElementSchema = z.looseObject({
  typeId: z.number().int(),
  elements: z.unknown(),
});

export const TypeListSchema = z.looseObject({
  typeListId: z.number().int(),
  includedTypeIDs: z.unknown(),
  name: z.string(),
  includedGroupIDs: z.unknown().nullable(),
  includedCategoryIDs: z.unknown().nullable(),
  excludedGroupIDs: z.unknown().nullable(),
  excludedTypeIDs: z.unknown().nullable(),
  excludedCategoryIDs: z.unknown().nullable(),
});

export const TypeMaterialSchema = z.looseObject({
  typeId: z.number().int(),
  materials: z.unknown(),
});

export const EveTypeSchema = z.looseObject({
  typeId: z.number().int(),
  groupId: z.number().int(),
  mass: z.number(),
  name: z.string(),
  portionSize: z.number().int(),
  published: z.boolean(),
  packagedVolume: z.number().nullable(),
  volume: z.number().nullable(),
  radius: z.number().nullable(),
  description: z.string().nullable(),
  graphicId: z.number().int().nullable(),
  soundId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  raceId: z.number().int().nullable(),
  basePrice: z.number().nullable(),
  marketGroupId: z.number().int().nullable(),
  capacity: z.number().nullable(),
  isRepackable: z.boolean().nullable(),
});

// ===================================================================
// Version
// ===================================================================

export const SdeVersionSchema = z.looseObject({
  version: z.string(),
  buildDate: z.string(),
  importedAt: z.string(),
  checksum: z.string().optional(),
});
