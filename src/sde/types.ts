// ===================================================================
// Sub-interfaces for JSON fields
// ===================================================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface StarStatistics {
  age: number;
  life: number;
  luminosity: number;
  locked: boolean;
  spectralClass: string;
  temperature: number;
}

export interface StargateDestination {
  solarSystemId: number;
  stargateId: number;
}

export interface BlueprintMaterial {
  typeId: number;
  quantity: number;
}

export interface BlueprintProduct {
  typeId: number;
  quantity: number;
  probability?: number;
}

export interface BlueprintActivity {
  time: number;
  materials?: BlueprintMaterial[];
  products?: BlueprintProduct[];
}

export interface BlueprintActivities {
  manufacturing?: BlueprintActivity;
  research_material?: BlueprintActivity;
  research_time?: BlueprintActivity;
  copying?: BlueprintActivity;
  invention?: BlueprintActivity;
}

// ===================================================================
// Entity interfaces (ordered by table name)
// ===================================================================

/** eve_accounting_entry_types [177 rows] */
export interface AccountingEntryType {
  accountingEntryTypeId: number;
  internalName: string;
  name: string;
  journalMessage: string | null;
  description: string | null;
}

/** eve_agent_types [13 rows] */
export interface AgentType {
  agentTypeId: number;
  name: string;
}

/** eve_agents_in_space [360 rows] */
export interface AgentInSpace {
  characterId: number;
  dungeonId: number;
  solarSystemId: number;
  spawnPointId: number;
  typeId: number;
}

/** eve_ancestries [43 rows] */
export interface Ancestry {
  ancestryId: number;
  bloodlineId: number;
  charisma: number;
  description: string;
  iconId: number;
  intelligence: number;
  memory: number;
  name: string;
  perception: number;
  shortDescription: string;
  willpower: number;
}

/** eve_applied_proximity_effects [118 rows] */
export interface AppliedProximityEffect {
  appliedProximityEffectId: number;
  dbuffs: unknown;
  delaySeconds: number;
  radius: number;
}

/** eve_archetypes [34 rows] */
export interface Archetype {
  archetypeId: number;
  description: string;
  title: string;
}

/** eve_asteroid_belts [40928 rows] */
export interface AsteroidBelt {
  asteroidBeltId: number;
  celestialIndex: number;
  orbitId: number;
  orbitIndex: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
}

/** eve_bloodlines [18 rows] */
export interface Bloodline {
  bloodlineId: number;
  charisma: number;
  corporationId: number;
  description: string;
  iconId: number;
  intelligence: number;
  memory: number;
  name: string;
  perception: number;
  raceId: number;
  willpower: number;
}

/** eve_blueprints [5082 rows] */
export interface Blueprint {
  activities: BlueprintActivities;
  blueprintTypeId: number;
  maxProductionLimit: number;
}

/** eve_categories [48 rows] */
export interface EveCategory {
  categoryId: number;
  name: string;
  published: boolean;
  iconId: number | null;
}

/** eve_certificates [139 rows] */
export interface Certificate {
  certificateId: number;
  description: string;
  groupId: number;
  name: string;
  recommendedFor: unknown;
  skillTypes: unknown;
}

/** eve_character_attributes [5 rows] */
export interface CharacterAttribute {
  attributeId: number;
  description: string;
  iconId: number;
  name: string;
  notes: string;
  shortDescription: string;
}

/** eve_character_titles [43 rows] */
export interface CharacterTitle {
  name: string;
}

/** eve_clone_grades [4 rows] */
export interface CloneGrade {
  cloneGradeId: number;
  name: string;
  skills: unknown;
}

/** eve_compressible_types [212 rows] */
export interface CompressibleType {
  typeId: number;
  compressedTypeId: number;
}

/** eve_constellations [1184 rows] */
export interface Constellation {
  constellationId: number;
  factionId: number;
  name: string;
  position: Position3D;
  regionId: number;
  solarSystemIDs: number[];
  wormholeClassId: number;
}

/** eve_contraband_types [8 rows] */
export interface ContrabandType {
  typeId: number;
  factions: unknown;
}

/** eve_control_tower_resources [44 rows] */
export interface ControlTowerResource {
  typeId: number;
  resources: unknown;
}

/** eve_corporation_activities [20 rows] */
export interface CorporationActivity {
  corporationActivityId: number;
  name: string;
}

/** eve_corporation_role_groups [9 rows] */
export interface CorporationRoleGroup {
  corporationRoleGroupId: number;
  appliesTo: string;
  appliesToGrantable: string;
  isDivisional: boolean;
  isLocational: boolean;
  name: string;
}

/** eve_corporation_roles [55 rows] */
export interface CorporationRole {
  corporationRoleId: number;
  description: string;
  name: string;
  roleGroupIDs: unknown;
  shortName: string;
}

/** eve_dbuff_collections [276 rows] */
export interface DbuffCollection {
  dbuffCollectionId: number;
  aggregateMode: string;
  developerDescription: unknown;
  itemModifiers: unknown;
  locationGroupModifiers: unknown;
  locationModifiers: unknown;
  locationRequiredSkillModifiers: unknown;
  operationName: string;
  showOutputValueInUI: string;
  displayName: string | null;
}

/** eve_dogma_attribute_categories [37 rows] */
export interface DogmaAttributeCategory {
  attributeCategoryId: number;
  description: string;
  name: string;
}

/** eve_dogma_attributes [2866 rows] */
export interface DogmaAttribute {
  attributeId: number;
  attributeCategoryId: number;
  dataType: number;
  defaultValue: number;
  description: string;
  displayWhenZero: boolean;
  highIsGood: boolean;
  name: string;
  published: boolean;
  stackable: boolean;
  displayName: string | null;
  iconId: number | null;
  tooltipDescription: string | null;
  tooltipTitle: string | null;
  unitId: number | null;
  chargeRechargeTimeId: number | null;
  maxAttributeId: number | null;
  minAttributeId: number | null;
}

/** eve_dogma_effects [3417 rows] */
export interface DogmaEffect {
  effectId: number;
  disallowAutoRepeat: boolean;
  dischargeAttributeId: number;
  durationAttributeId: number;
  effectCategoryId: number;
  electronicChance: boolean;
  guid: string;
  isAssistance: boolean;
  isOffensive: boolean;
  isWarpSafe: boolean;
  name: string;
  propulsionChance: boolean;
  published: boolean;
  rangeChance: boolean;
  distribution: string | null;
  falloffAttributeId: number | null;
  rangeAttributeId: number | null;
  trackingSpeedAttributeId: number | null;
  description: string | null;
  displayName: string | null;
  iconId: number | null;
  modifierInfo: unknown;
}

/** eve_dogma_units [60 rows] */
export interface DogmaUnit {
  unitId: number;
  description: string;
  displayName: string;
  name: string;
}

/** eve_dungeons [1409 rows] */
export interface Dungeon {
  dungeonId: number;
  allowedShipsList: unknown;
  archetypeId: number;
  description: string;
  factionId: number;
  name: string;
}

/** eve_dynamic_item_attributes [413 rows] */
export interface DynamicItemAttribute {
  dynamicItemAttributeId: number;
  attributeIDs: unknown;
  inputOutputMapping: unknown;
}

/** eve_epic_arcs [21 rows] */
export interface EpicArc {
  epicArcId: number;
  arcRestartInterval: number;
  factionId: number;
  iconId: number;
  missions: unknown;
  name: string;
}

/** eve_expert_systems [55 rows] */
export interface ExpertSystem {
  expertSystemId: number;
  durationDays: number;
  hidden: boolean;
  internalName: string;
  retired: boolean;
  skillsGranted: unknown;
  associatedShipTypes: unknown;
}

/** eve_factions [27 rows] */
export interface Faction {
  factionId: number;
  corporationId: number;
  description: string;
  flatLogo: string;
  flatLogoWithName: string;
  iconId: number;
  memberRaces: number[];
  militiaCorporationId: number;
  name: string;
  shortDescription: string;
  sizeFactor: number;
  solarSystemId: number;
  uniqueName: boolean;
}

/** eve_fighter_abilities [36 rows] */
export interface FighterAbility {
  fighterAbilityId: number;
  disallowInHighSec: boolean;
  disallowInLowSec: boolean;
  displayName: string;
  iconId: number;
  targetMode: string;
  tooltipText: string | null;
  turretGraphicId: number | null;
}

/** eve_fighter_abilities_by_type [94 rows] */
export interface FighterAbilityByType {
  typeId: number;
  abilitySlot0: unknown;
  abilitySlot1: unknown;
  abilitySlot2: unknown;
}

/** eve_freelance_job_schemas [1 row] */
export interface FreelanceJobSchema {
  freelanceJobSchemaGroupId: number;
  BoostShield: unknown;
  CaptureFWComplex: unknown;
  DamageShip: unknown;
  DefendFWComplex: unknown;
  DeliverItem: unknown;
  KillCapsuleer: unknown;
  KillNPC: unknown;
  MineOre: unknown;
  RepairArmor: unknown;
  ShipInsurance: unknown;
}

/** eve_graphic_material_sets [939 rows] */
export interface GraphicMaterialSet {
  materialSetId: number;
  colorHull: unknown;
  colorPrimary: unknown;
  colorSecondary: unknown;
  colorWindow: unknown;
  description: string;
  sofFactionName: string;
  sofRaceHint: string;
  material1: string | null;
  material2: string | null;
  material3: string | null;
  material4: string | null;
  custommaterial1: string | null;
  custommaterial2: string | null;
  sofPatternName: string | null;
}

/** eve_graphics [6069 rows] */
export interface Graphic {
  graphicId: number;
  graphicFile: string;
  iconFolder: string | null;
  sofFactionName: string | null;
  sofHullName: string | null;
  sofRaceName: string | null;
}

/** eve_groups [1610 rows] */
export interface EveGroup {
  groupId: number;
  anchorable: boolean;
  anchored: boolean;
  categoryId: number;
  fittableNonSingleton: boolean;
  name: string;
  published: boolean;
  useBasePrice: boolean;
  iconId: number | null;
}

/** eve_icons [4658 rows] */
export interface Icon {
  iconId: number;
  iconFile: string;
}

/** eve_industry_activities [6 rows] */
export interface IndustryActivity {
  industryActivityId: number;
  description: string;
  name: string;
}

/** eve_industry_assembly_lines [146 rows] */
export interface IndustryAssemblyLine {
  assemblyLineId: number;
  activityId: number;
  baseMaterialMultiplier: number;
  baseTimeMultiplier: number;
  description: string;
  name: string;
  detailsPerGroup: unknown;
  baseCostMultiplier: number | null;
  detailsPerCategory: unknown;
}

/** eve_industry_installation_types [102 rows] */
export interface IndustryInstallationType {
  installationTypeId: number;
  assemblyLines: unknown;
}

/** eve_industry_modifier_sources [220 rows] */
export interface IndustryModifierSource {
  modifierSourceId: number;
  copying: unknown;
  invention: unknown;
  manufacturing: unknown;
  researchMaterial: unknown;
  researchTime: unknown;
  reaction: unknown;
}

/** eve_industry_target_filters [18 rows] */
export interface IndustryTargetFilter {
  targetFilterId: number;
  categoryIDs: unknown;
  name: string;
  groupIDs: unknown;
}

/** eve_landmarks [45 rows] */
export interface Landmark {
  landmarkId: number;
  description: string;
  name: string;
  position: Position3D;
  iconId: number | null;
  locationId: number | null;
}

/** eve_link_with_ship [3 rows] */
export interface LinkWithShip {
  linkWithShipId: number;
  applyPvpFlag: boolean;
  canRelink: boolean;
  characterEnergyCost: number;
  dbuffPostLinkDuration: number;
  dbuffs: unknown;
  generateCynoInhibitor: boolean;
  keepDbuffDurationOnLinkBreak: boolean;
  linkDuration: number;
  linkEffectGraphicIdOverride: number;
  linkableShipTypeListId: number;
  maxLinkRange: number;
  omegaOnly: boolean;
  solarsystemInterferenceCost: number;
}

/** eve_market_groups [2106 rows] */
export interface MarketGroup {
  marketGroupId: number;
  description: string;
  hasTypes: boolean;
  iconId: number;
  name: string;
  parentGroupId: number | null;
}

/** eve_masteries [476 rows] */
export interface Mastery {
  typeId: number;
  '0': unknown;
  '1': unknown;
  '2': unknown;
  '3': unknown;
  '4': unknown;
}

/** eve_mercenary_tactical_operations [3 rows] */
export interface MercenaryTacticalOperation {
  mercenaryTacticalOperationId: number;
  anarchyImpact: number;
  description: string;
  developmentImpact: number;
  dungeonId: number;
  infomorphBonus: number;
  name: string;
}

/** eve_meta_groups [13 rows] */
export interface MetaGroup {
  metaGroupId: number;
  color: unknown;
  name: string;
  iconId: number | null;
  iconSuffix: string | null;
  description: string | null;
}

/** eve_metenox_moon_drill [1 row] */
export interface MetenoxMoonDrill {
  metenoxMoonDrillId: number;
  miningCycleTime: number;
  miningEfficiency: number;
  reagentsConsumedPerCycle: number;
}

/** eve_military_campaign_objectives [116 rows] — string PK */
export interface MilitaryCampaignObjective {
  militaryCampaignObjectiveId: string;
  campaignId: string;
  careerPath: string;
  contentTags: unknown;
  contributionMethodConfiguration: unknown;
  issuer: unknown;
  maxProgressPerParticipant: number;
  presentingCharacterId: number;
  rewards: unknown;
  subtitle: string;
  targetProgress: number;
  title: string;
  annotations: unknown;
}

/** eve_military_campaigns [4 rows] — string PK */
export interface MilitaryCampaign {
  militaryCampaignId: string;
  annotations: unknown;
  issuer: unknown;
  subtitle: string;
  targetProgress: number;
  title: string;
}

/** eve_missions [2892 rows] */
export interface Mission {
  missionId: number;
  hasStandingRewards: boolean;
  killMission: unknown;
  messages: unknown;
  name: string;
  expirationTime: string | null;
  factionId: number | null;
}

/** eve_moons [344457 rows] */
export interface Moon {
  moonId: number;
  attributes: unknown;
  celestialIndex: number;
  orbitId: number;
  orbitIndex: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
  npcStationIDs: number[] | null;
}

/** eve_notification_types [297 rows] */
export interface NotificationType {
  notificationTypeId: number;
  displayName: string;
  internalName: string;
}

/** eve_npc_characters [11393 rows] */
export interface NpcCharacter {
  characterId: number;
  bloodlineId: number;
  ceo: boolean;
  corporationId: number;
  gender: number;
  locationId: number;
  name: string;
  raceId: number;
  startDate: string;
  uniqueName: boolean;
  skills: unknown;
  ancestryId: number | null;
  careerId: number | null;
  schoolId: number | null;
  specialityId: number | null;
}

/** eve_npc_corporation_divisions [10 rows] */
export interface NpcCorporationDivision {
  npcCorporationDivisionId: number;
  displayName: string;
  internalName: string;
  leaderTypeName: string;
  name: string;
  description: string | null;
}

/** eve_npc_corporations [283 rows] */
export interface NpcCorporation {
  corporationId: number;
  ceoId: number;
  deleted: boolean;
  description: string;
  extent: string;
  hasPlayerPersonnelManager: boolean;
  initialPrice: number;
  memberLimit: number;
  minSecurity: number;
  minimumJoinStanding: number;
  name: string;
  sendCharTerminationMessage: boolean;
  shares: number;
  size: string;
  stationId: number;
  taxRate: number;
  tickerName: string;
  uniqueName: boolean;
  allowedMemberRaces: unknown;
  corporationTrades: unknown;
  divisions: unknown;
  enemyId: number | null;
  factionId: number | null;
  friendId: number | null;
  iconId: number | null;
  investors: unknown;
  lpOfferTables: unknown;
  mainActivityId: number | null;
  raceId: number | null;
  sizeFactor: number | null;
  solarSystemId: number | null;
  secondaryActivityId: number | null;
}

/** eve_npc_stations [5210 rows] */
export interface NpcStation {
  stationId: number;
  celestialIndex: number;
  operationId: number;
  orbitId: number;
  orbitIndex: number;
  ownerId: number;
  position: Position3D;
  reprocessingEfficiency: number;
  reprocessingHangarFlag: number;
  reprocessingStationsTake: number;
  solarSystemId: number;
  typeId: number;
  useOperationName: boolean;
}

/** eve_planet_resources [25798 rows] */
export interface PlanetResource {
  planetId: number;
  power: number;
  workforce: number | null;
  reagent: unknown;
}

/** eve_planet_schematics [68 rows] */
export interface PlanetSchematic {
  planetSchematicId: number;
  cycleTime: number;
  name: string;
  pins: unknown;
  types: unknown;
}

/** eve_planets [68407 rows] */
export interface Planet {
  planetId: number;
  asteroidBeltIDs: number[];
  attributes: unknown;
  celestialIndex: number;
  moonIDs: number[];
  orbitId: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
  npcStationIDs: number[] | null;
}

/** eve_proximity_traps [24 rows] */
export interface ProximityTrap {
  proximityTrapId: number;
  dbuffDuration: number;
  showPerimeterLights: boolean;
  triggerDelay: number;
  triggerFilterTypeListId: number;
  triggerRange: number;
  dbuffs: unknown;
  forceDecloakDuration: number | null;
  resetDelay: number | null;
}

/** eve_races [11 rows] */
export interface Race {
  raceId: number;
  description: string;
  iconId: number;
  name: string;
  shipTypeId: number;
  skills: unknown;
}

/** eve_regions [114 rows] */
export interface Region {
  regionId: number;
  constellationIDs: number[];
  description: string;
  factionId: number;
  name: string;
  nebulaId: number;
  position: Position3D;
  wormholeClassId: number;
}

/** eve_school_map [12 rows] */
export interface SchoolMap {
  schoolMapId: number;
  schoolId: number;
  solarSystemId: number;
}

/** eve_schools [23 rows] */
export interface School {
  schoolId: number;
  careerAgents: unknown;
  careerId: number;
  characterDescription: string;
  corporationId: number;
  description: string;
  iconId: number;
  name: string;
  raceId: number;
  startingStations: unknown;
  title: string;
  isStarterSpaceSchool: string | null;
}

/** eve_secondary_suns [1038 rows] */
export interface SecondarySun {
  secondarySunId: number;
  effectBeaconTypeId: number;
  position: Position3D;
  solarSystemId: number;
  typeId: number;
}

/** eve_ship_tree_elements [30 rows] */
export interface ShipTreeElement {
  shipTreeElementId: number;
  description: string;
  icon: string;
  name: string;
}

/** eve_ship_tree_factions [17 rows] */
export interface ShipTreeFaction {
  factionId: number;
  description: string;
  elements: unknown;
  icon: string;
}

/** eve_ship_tree_groups [52 rows] */
export interface ShipTreeGroup {
  shipTreeGroupId: number;
  description: string;
  elements: unknown;
  icon: string;
  iconLarge: string;
  iconSmall: string;
  iconSmallNPC: string;
  name: string;
  preReqSkills: unknown;
}

/** eve_skill_plans [40 rows] */
export interface SkillPlan {
  skillPlanId: number;
  careerPathId: number;
  description: string;
  factionId: number;
  internalName: string;
  milestones: unknown;
  name: string;
  skillRequirements: unknown;
  npcCorporationDivision: string | null;
}

/** eve_skin_licenses [11824 rows] */
export interface SkinLicense {
  duration: number;
  licenseTypeId: number;
  skinId: number;
}

/** eve_skin_materials [863 rows] — no PK */
export interface SkinMaterial {
  displayName: string;
  materialSetId: number;
}

/** eve_skinr_component_categories [3 rows] */
export interface SkinrComponentCategory {
  skinrComponentCategoryId: number;
  name: string;
}

/** eve_skinr_component_point_values [3 rows] — numeric column names, no PK */
export interface SkinrComponentPointValue {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
}

/** eve_skinr_component_rarities [6 rows] */
export interface SkinrComponentRarity {
  skinrComponentRarityId: number;
  name: string;
  rank: number;
}

/** eve_skinr_components [544 rows] */
export interface SkinrComponent {
  skinrComponentId: number;
  associatedTypeIds: unknown;
  category: number;
  finish: string;
  iconFile: string;
  name: string;
  projectionTypeU: string;
  projectionTypeV: string;
  published: boolean;
  rarity: number;
  resourceFile: string;
  sequenceBinder: unknown;
}

/** eve_skinr_slot_categories [3 rows] */
export interface SkinrSlotCategory {
  skinrSlotCategoryId: number;
  name: string;
}

/** eve_skinr_slot_configurations [4 rows] */
export interface SkinrSlotConfiguration {
  skinrSlotConfigurationId: number;
  allowAllShips: boolean;
  config: unknown;
  name: string;
  priority: number;
  ships: unknown;
}

/** eve_skinr_slot_names [8 rows] */
export interface SkinrSlotName {
  skinrSlotNameId: number;
  name: string;
}

/** eve_skinr_slots [8 rows] */
export interface SkinrSlot {
  skinrSlotId: number;
  allowedDesignComponentCategories: unknown;
  category: number;
  name: string;
}

/** eve_skinr_slots_to_materials [16 rows] */
export interface SkinrSlotToMaterial {
  skinrSlotToMaterialId: number;
  '0': unknown;
  '1': unknown;
  '2': unknown;
  '3': unknown;
}

/** eve_skinr_tier_thresholds [49 rows] — numeric column names, no PK */
export interface SkinrTierThreshold {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
  '11': number;
  '12': number;
  '13': number;
  '14': number;
  '15': number;
  '16': number;
  '17': number;
  '18': number;
  '19': number;
}

/** eve_skins [6995 rows] */
export interface Skin {
  skinId: number;
  allowCCPDevs: boolean;
  internalName: string;
  skinMaterialId: number;
  types: unknown;
  visibleSerenity: boolean;
  visibleTranquility: boolean;
  isStructureSkin: string | null;
}

/** eve_solar_systems [8490 rows] */
export interface SolarSystem {
  systemId: number;
  border: boolean;
  constellationId: number;
  hub: boolean;
  international: boolean;
  luminosity: number;
  name: string;
  planetIDs: number[];
  position: Position3D;
  position2D: Position2D;
  radius: number;
  regionId: number;
  regional: boolean;
  securityClass: string;
  securityStatus: number;
  starId: number;
  stargateIDs: number[];
  corridor: boolean | null;
  fringe: boolean | null;
  wormholeClassId: number | null;
  visualEffect: string | null;
}

/** eve_sovereignty_upgrades [49 rows] */
export interface SovereigntyUpgrade {
  typeId: number;
  fuel: unknown;
  mutually_exclusive_group: string;
  power_allocation: number;
  workforce_allocation: number;
  power_production: number | null;
  workforce_production: number | null;
}

/** eve_stargates [13978 rows] */
export interface Stargate {
  stargateId: number;
  destination: StargateDestination;
  position: Position3D;
  solarSystemId: number;
  typeId: number;
}

/** eve_stars [8089 rows] */
export interface Star {
  starId: number;
  radius: number;
  solarSystemId: number;
  statistics: StarStatistics;
  typeId: number;
}

/** eve_station_operations [69 rows] */
export interface StationOperation {
  stationOperationId: number;
  activityId: number;
  border: number;
  corridor: number;
  description: string;
  fringe: number;
  hub: number;
  manufacturingFactor: number;
  operationName: string;
  ratio: number;
  researchFactor: number;
  services: unknown;
  stationTypes: unknown;
}

/** eve_station_services [27 rows] */
export interface StationService {
  stationServiceId: number;
  serviceName: string;
  description: string | null;
}

/** eve_station_standings_restrictions [1 row] */
export interface StationStandingsRestriction {
  stationStandingsRestrictionId: number;
  services: unknown;
}

/** eve_system_dbuff_emitters [1 row] */
export interface SystemDbuffEmitter {
  systemDbuffEmitterId: number;
  dbuffs: unknown;
  duration: number;
  excludeProtected: boolean;
  interval: number;
}

/** eve_system_wide_effects [95 rows] */
export interface SystemWideEffect {
  systemWideEffectId: number;
  dbuffs: unknown;
  eligibleTypeListId: number;
  environmentTypeId: number | null;
}

/** eve_translation_languages [8 rows] — string PK */
export interface TranslationLanguage {
  translationLanguageId: string;
  name: string;
}

/** eve_type_bonuses [652 rows] */
export interface TypeBonus {
  typeId: number;
  roleBonuses: unknown;
  types: unknown;
}

/** eve_type_dogma [26828 rows] */
export interface TypeDogma {
  typeId: number;
  dogmaAttributes: unknown;
  dogmaEffects: unknown;
}

/** eve_type_elements [423 rows] */
export interface TypeElement {
  typeId: number;
  elements: unknown;
}

/** eve_type_lists [462 rows] */
export interface TypeList {
  typeListId: number;
  includedTypeIDs: unknown;
  name: string;
  includedGroupIDs: unknown;
  includedCategoryIDs: unknown;
  excludedGroupIDs: unknown;
  excludedTypeIDs: unknown;
  excludedCategoryIDs: unknown;
}

/** eve_type_materials [9551 rows] */
export interface TypeMaterial {
  typeId: number;
  materials: unknown;
}

/** eve_types [52863 rows] */
export interface EveType {
  typeId: number;
  groupId: number;
  mass: number;
  name: string;
  portionSize: number;
  published: boolean;
  packagedVolume: number | null;
  volume: number | null;
  radius: number | null;
  description: string | null;
  graphicId: number | null;
  soundId: number | null;
  iconId: number | null;
  raceId: number | null;
  basePrice: number | null;
  marketGroupId: number | null;
  capacity: number | null;
  isRepackable: boolean | null;
}
