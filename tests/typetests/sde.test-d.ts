/**
 * The `./sde` entry point: every `IStaticDataProvider` method's return type
 * (a nullable record for a lookup by ID, an array for a list or a search),
 * both providers' construction surfaces, the `MemorySdeData` keys against the
 * entity type names, the error guards' narrowing, the version record, every
 * exported entity type's identifying field, and the test data factory.
 *
 * Type mutation (`npm run test:type-mutation`) scores this file against the
 * built declarations of `./sde`; `config/mutation/type-thresholds.json`
 * holds the floor.
 */
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import type { Clock } from '../../src/core/ports/Clock';
import {
  MemorySdeProvider,
  SdeDataProvider,
  SdeDatabaseError,
  SdeError,
  SdeTestDataFactory,
  SdeValidationError,
  SdeVersionMismatchError,
  isSdeDatabaseError,
  isSdeError,
  isSdeValidationError,
  isSdeVersionMismatch,
  type IStaticDataProvider,
  type MemorySdeData,
  type SdeDataProviderOptions,
  type SdeVersionInfo,
  type SkinrComponentPointValue,
  type SkinrTierThreshold,
  type Position3D,
  Position2D,
  StarStatistics,
  StargateDestination,
  BlueprintMaterial,
  BlueprintProduct,
  BlueprintActivity,
  BlueprintActivities,
  AccountingEntryType,
  AgentType,
  AgentInSpace,
  Ancestry,
  AppliedProximityEffect,
  Archetype,
  AsteroidBelt,
  Bloodline,
  Blueprint,
  EveCategory,
  Certificate,
  CharacterAttribute,
  CharacterTitle,
  CloneGrade,
  CompressibleType,
  Constellation,
  ContrabandType,
  ControlTowerResource,
  CorporationActivity,
  CorporationRoleGroup,
  CorporationRole,
  DbuffCollection,
  DogmaAttributeCategory,
  DogmaAttribute,
  DogmaEffect,
  DogmaUnit,
  Dungeon,
  DynamicItemAttribute,
  EpicArc,
  ExpertSystem,
  Faction,
  FighterAbility,
  FighterAbilityByType,
  FreelanceJobSchema,
  GraphicMaterialSet,
  Graphic,
  EveGroup,
  Icon,
  IndustryActivity,
  IndustryAssemblyLine,
  IndustryInstallationType,
  IndustryModifierSource,
  IndustryTargetFilter,
  Landmark,
  LinkWithShip,
  MarketGroup,
  Mastery,
  MercenaryTacticalOperation,
  MetaGroup,
  MetenoxMoonDrill,
  MilitaryCampaignObjective,
  MilitaryCampaign,
  Mission,
  Moon,
  NotificationType,
  NpcCharacter,
  NpcCorporationDivision,
  NpcCorporation,
  NpcStation,
  PlanetResource,
  PlanetSchematic,
  Planet,
  ProximityTrap,
  Race,
  Region,
  SchoolMap,
  School,
  SecondarySun,
  ShipTreeElement,
  ShipTreeFaction,
  ShipTreeGroup,
  SkillPlan,
  SkinLicense,
  SkinMaterial,
  SkinrComponentCategory,
  SkinrComponentRarity,
  SkinrComponent,
  SkinrSlotCategory,
  SkinrSlotConfiguration,
  SkinrSlotName,
  SkinrSlot,
  SkinrSlotToMaterial,
  Skin,
  SolarSystem,
  SovereigntyUpgrade,
  Stargate,
  Star,
  StationOperation,
  StationService,
  StationStandingsRestriction,
  SystemDbuffEmitter,
  SystemWideEffect,
  TranslationLanguage,
  TypeBonus,
  TypeDogma,
  TypeElement,
  TypeList,
  TypeMaterial,
  EveType,
} from '../../src/sde';

// --- Construction ---

declare const clock: Clock;
expectType<SdeDataProvider>(SdeDataProvider.fromDirectory('./sde-data'));
expectType<SdeDataProvider>(
  SdeDataProvider.fromDirectory('./sde-data', { clock }),
);
expectType<SdeDataProvider>(SdeDataProvider.fromZip('./sde.zip', {}));
expectAssignable<SdeDataProviderOptions>({});
expectAssignable<SdeDataProviderOptions>({ clock });
expectError(SdeDataProvider.fromDirectory());
expectError(SdeDataProvider.fromDirectory(42));
expectError(SdeDataProvider.fromZip('./sde.zip', { clock: 'now' }));
expectAssignable<IStaticDataProvider>(SdeDataProvider.fromZip('./sde.zip'));
expectAssignable<IStaticDataProvider>(new MemorySdeProvider());
expectAssignable<IStaticDataProvider>(new MemorySdeProvider({ types: [] }));
expectError(new MemorySdeProvider({ types: [{}] }));
expectError(new MemorySdeProvider('./sde-data'));

// --- Every provider method, on the port, the SQLite provider and the memory provider ---

declare const provider: IStaticDataProvider;
expectType<EveType | null>(provider.getType(1));
expectError(provider.getType('1'));
expectType<EveType[]>(provider.getTypesByGroup(1));
expectError(provider.getTypesByGroup('1'));
expectType<EveGroup | null>(provider.getGroup(1));
expectError(provider.getGroup('1'));
expectType<EveGroup[]>(provider.getGroupsByCategory(1));
expectError(provider.getGroupsByCategory('1'));
expectType<EveCategory | null>(provider.getCategory(1));
expectError(provider.getCategory('1'));
expectType<EveCategory[]>(provider.getAllCategories());
expectType<Region | null>(provider.getRegion(1));
expectError(provider.getRegion('1'));
expectType<Region[]>(provider.getAllRegions());
expectType<Constellation | null>(provider.getConstellation(1));
expectError(provider.getConstellation('1'));
expectType<Constellation[]>(provider.getConstellationsByRegion(1));
expectError(provider.getConstellationsByRegion('1'));
expectType<SolarSystem | null>(provider.getSolarSystem(1));
expectError(provider.getSolarSystem('1'));
expectType<SolarSystem[]>(provider.getSolarSystemsByConstellation(1));
expectError(provider.getSolarSystemsByConstellation('1'));
expectType<Stargate | null>(provider.getStargate(1));
expectError(provider.getStargate('1'));
expectType<Stargate[]>(provider.getStargatesBySystem(1));
expectError(provider.getStargatesBySystem('1'));
expectType<EveType[]>(provider.searchTypesByName('a'));
expectError(provider.searchTypesByName(1));
expectType<EveType[]>(provider.searchTypesByName('a', 5));
expectError(provider.searchTypesByName('a', '5'));
expectType<SolarSystem[]>(provider.searchSolarSystemsByName('a'));
expectError(provider.searchSolarSystemsByName(1));
expectType<SolarSystem[]>(provider.searchSolarSystemsByName('a', 5));
expectError(provider.searchSolarSystemsByName('a', '5'));
expectType<Star | null>(provider.getStar(1));
expectError(provider.getStar('1'));
expectType<Star | null>(provider.getStarBySystem(1));
expectError(provider.getStarBySystem('1'));
expectType<Planet | null>(provider.getPlanet(1));
expectError(provider.getPlanet('1'));
expectType<Planet[]>(provider.getPlanetsBySystem(1));
expectError(provider.getPlanetsBySystem('1'));
expectType<Moon | null>(provider.getMoon(1));
expectError(provider.getMoon('1'));
expectType<Moon[]>(provider.getMoonsBySystem(1));
expectError(provider.getMoonsBySystem('1'));
expectType<AsteroidBelt | null>(provider.getAsteroidBelt(1));
expectError(provider.getAsteroidBelt('1'));
expectType<AsteroidBelt[]>(provider.getAsteroidBeltsBySystem(1));
expectError(provider.getAsteroidBeltsBySystem('1'));
expectType<Faction | null>(provider.getFaction(1));
expectError(provider.getFaction('1'));
expectType<Faction[]>(provider.getAllFactions());
expectType<Race | null>(provider.getRace(1));
expectError(provider.getRace('1'));
expectType<Race[]>(provider.getAllRaces());
expectType<Bloodline | null>(provider.getBloodline(1));
expectError(provider.getBloodline('1'));
expectType<Bloodline[]>(provider.getBloodlinesByRace(1));
expectError(provider.getBloodlinesByRace('1'));
expectType<Ancestry | null>(provider.getAncestry(1));
expectError(provider.getAncestry('1'));
expectType<Ancestry[]>(provider.getAncestriesByBloodline(1));
expectError(provider.getAncestriesByBloodline('1'));
expectType<NpcCorporation | null>(provider.getNpcCorporation(1));
expectError(provider.getNpcCorporation('1'));
expectType<NpcCorporation[]>(provider.getNpcCorporationsByFaction(1));
expectError(provider.getNpcCorporationsByFaction('1'));
expectType<NpcStation | null>(provider.getNpcStation(1));
expectError(provider.getNpcStation('1'));
expectType<NpcStation[]>(provider.getNpcStationsBySystem(1));
expectError(provider.getNpcStationsBySystem('1'));
expectType<NpcStation[]>(provider.getNpcStationsByOwner(1));
expectError(provider.getNpcStationsByOwner('1'));
expectType<MarketGroup | null>(provider.getMarketGroup(1));
expectError(provider.getMarketGroup('1'));
expectType<MarketGroup[]>(provider.getMarketGroupsByParent(1));
expectError(provider.getMarketGroupsByParent('1'));
expectType<MarketGroup[]>(provider.getRootMarketGroups());
expectType<EveType[]>(provider.getTypesByMarketGroup(1));
expectError(provider.getTypesByMarketGroup('1'));
expectType<MarketGroup[]>(provider.searchMarketGroupsByName('a'));
expectError(provider.searchMarketGroupsByName(1));
expectType<MarketGroup[]>(provider.searchMarketGroupsByName('a', 5));
expectError(provider.searchMarketGroupsByName('a', '5'));
expectType<MetaGroup | null>(provider.getMetaGroup(1));
expectError(provider.getMetaGroup('1'));
expectType<MetaGroup[]>(provider.getAllMetaGroups());
expectType<Icon | null>(provider.getIcon(1));
expectError(provider.getIcon('1'));
expectType<Graphic | null>(provider.getGraphic(1));
expectError(provider.getGraphic('1'));
expectType<DogmaAttribute | null>(provider.getDogmaAttribute(1));
expectError(provider.getDogmaAttribute('1'));
expectType<DogmaAttribute[]>(provider.searchDogmaAttributesByName('a'));
expectError(provider.searchDogmaAttributesByName(1));
expectType<DogmaAttribute[]>(provider.searchDogmaAttributesByName('a', 5));
expectError(provider.searchDogmaAttributesByName('a', '5'));
expectType<DogmaEffect | null>(provider.getDogmaEffect(1));
expectError(provider.getDogmaEffect('1'));
expectType<DogmaEffect[]>(provider.searchDogmaEffectsByName('a'));
expectError(provider.searchDogmaEffectsByName(1));
expectType<DogmaEffect[]>(provider.searchDogmaEffectsByName('a', 5));
expectError(provider.searchDogmaEffectsByName('a', '5'));
expectType<DogmaAttributeCategory | null>(
  provider.getDogmaAttributeCategory(1),
);
expectError(provider.getDogmaAttributeCategory('1'));
expectType<DogmaAttributeCategory[]>(provider.getAllDogmaAttributeCategories());
expectType<DogmaUnit | null>(provider.getDogmaUnit(1));
expectError(provider.getDogmaUnit('1'));
expectType<DogmaUnit[]>(provider.getAllDogmaUnits());
expectType<Blueprint | null>(provider.getBlueprint(1));
expectError(provider.getBlueprint('1'));
expectType<PlanetSchematic | null>(provider.getPlanetSchematic(1));
expectError(provider.getPlanetSchematic('1'));
expectType<PlanetSchematic[]>(provider.getAllPlanetSchematics());
expectType<IndustryActivity | null>(provider.getIndustryActivity(1));
expectError(provider.getIndustryActivity('1'));
expectType<IndustryActivity[]>(provider.getAllIndustryActivities());
expectType<AgentType | null>(provider.getAgentType(1));
expectError(provider.getAgentType('1'));
expectType<AgentType[]>(provider.getAllAgentTypes());
expectType<AgentInSpace | null>(provider.getAgentInSpace(1));
expectError(provider.getAgentInSpace('1'));
expectType<AgentInSpace[]>(provider.getAgentsInSpaceBySystem(1));
expectError(provider.getAgentsInSpaceBySystem('1'));
expectType<Certificate | null>(provider.getCertificate(1));
expectError(provider.getCertificate('1'));
expectType<Certificate[]>(provider.getAllCertificates());
expectType<CharacterAttribute | null>(provider.getCharacterAttribute(1));
expectError(provider.getCharacterAttribute('1'));
expectType<CharacterAttribute[]>(provider.getAllCharacterAttributes());
expectType<NpcCharacter | null>(provider.getNpcCharacter(1));
expectError(provider.getNpcCharacter('1'));
expectType<NpcCharacter[]>(provider.getNpcCharactersByCorporation(1));
expectError(provider.getNpcCharactersByCorporation('1'));
expectType<NpcCharacter[]>(provider.searchNpcCharactersByName('a'));
expectError(provider.searchNpcCharactersByName(1));
expectType<NpcCharacter[]>(provider.searchNpcCharactersByName('a', 5));
expectError(provider.searchNpcCharactersByName('a', '5'));
expectType<CloneGrade | null>(provider.getCloneGrade(1));
expectError(provider.getCloneGrade('1'));
expectType<CloneGrade[]>(provider.getAllCloneGrades());
expectType<CorporationActivity | null>(provider.getCorporationActivity(1));
expectError(provider.getCorporationActivity('1'));
expectType<CorporationActivity[]>(provider.getAllCorporationActivities());
expectType<NpcCorporationDivision | null>(
  provider.getNpcCorporationDivision(1),
);
expectError(provider.getNpcCorporationDivision('1'));
expectType<NpcCorporationDivision[]>(provider.getAllNpcCorporationDivisions());
expectType<Landmark | null>(provider.getLandmark(1));
expectError(provider.getLandmark('1'));
expectType<Landmark[]>(provider.getAllLandmarks());
expectType<NotificationType | null>(provider.getNotificationType(1));
expectError(provider.getNotificationType('1'));
expectType<School | null>(provider.getSchool(1));
expectError(provider.getSchool('1'));
expectType<School[]>(provider.getAllSchools());
expectType<SecondarySun | null>(provider.getSecondarySun(1));
expectError(provider.getSecondarySun('1'));
expectType<SecondarySun[]>(provider.getSecondarySunsBySystem(1));
expectError(provider.getSecondarySunsBySystem('1'));
expectType<Skin | null>(provider.getSkin(1));
expectError(provider.getSkin('1'));
expectType<SkinLicense | null>(provider.getSkinLicense(1));
expectError(provider.getSkinLicense('1'));
expectType<SkinLicense[]>(provider.getSkinLicensesBySkin(1));
expectError(provider.getSkinLicensesBySkin('1'));
expectType<StationOperation | null>(provider.getStationOperation(1));
expectError(provider.getStationOperation('1'));
expectType<StationOperation[]>(provider.getAllStationOperations());
expectType<StationService | null>(provider.getStationService(1));
expectError(provider.getStationService('1'));
expectType<StationService[]>(provider.getAllStationServices());
expectType<TypeDogma | null>(provider.getTypeDogma(1));
expectError(provider.getTypeDogma('1'));
expectType<TypeMaterial | null>(provider.getTypeMaterial(1));
expectError(provider.getTypeMaterial('1'));
expectType<TypeBonus | null>(provider.getTypeBonus(1));
expectError(provider.getTypeBonus('1'));
expectType<Mission | null>(provider.getMission(1));
expectError(provider.getMission('1'));
expectType<Dungeon | null>(provider.getDungeon(1));
expectError(provider.getDungeon('1'));
expectType<EpicArc | null>(provider.getEpicArc(1));
expectError(provider.getEpicArc('1'));
expectType<EpicArc[]>(provider.getAllEpicArcs());
expectType<Record<string, unknown> | null>(provider.getEntity('eve_types', 34));
expectType<Record<string, unknown> | null>(
  provider.getEntity('eve_landmarks', 'a'),
);
expectType<EveType | null>(provider.getEntity<EveType>('eve_types', 34));
expectError(provider.getEntity('eve_types', true));
expectError(provider.getEntity(34, 34));
expectType<Record<string, unknown>[]>(provider.getAllEntities('eve_types'));
expectType<EveType[]>(provider.getAllEntities<EveType>('eve_types'));
expectError(provider.getAllEntities(34));
expectType<SdeVersionInfo>(provider.getVersion());
expectType<void>(provider.close());

declare const sqlite: SdeDataProvider;
expectType<EveType | null>(sqlite.getType(1));
expectError(sqlite.getType('1'));
expectType<EveType[]>(sqlite.getTypesByGroup(1));
expectError(sqlite.getTypesByGroup('1'));
expectType<EveGroup | null>(sqlite.getGroup(1));
expectError(sqlite.getGroup('1'));
expectType<EveGroup[]>(sqlite.getGroupsByCategory(1));
expectError(sqlite.getGroupsByCategory('1'));
expectType<EveCategory | null>(sqlite.getCategory(1));
expectError(sqlite.getCategory('1'));
expectType<EveCategory[]>(sqlite.getAllCategories());
expectType<Region | null>(sqlite.getRegion(1));
expectError(sqlite.getRegion('1'));
expectType<Region[]>(sqlite.getAllRegions());
expectType<Constellation | null>(sqlite.getConstellation(1));
expectError(sqlite.getConstellation('1'));
expectType<Constellation[]>(sqlite.getConstellationsByRegion(1));
expectError(sqlite.getConstellationsByRegion('1'));
expectType<SolarSystem | null>(sqlite.getSolarSystem(1));
expectError(sqlite.getSolarSystem('1'));
expectType<SolarSystem[]>(sqlite.getSolarSystemsByConstellation(1));
expectError(sqlite.getSolarSystemsByConstellation('1'));
expectType<Stargate | null>(sqlite.getStargate(1));
expectError(sqlite.getStargate('1'));
expectType<Stargate[]>(sqlite.getStargatesBySystem(1));
expectError(sqlite.getStargatesBySystem('1'));
expectType<EveType[]>(sqlite.searchTypesByName('a'));
expectError(sqlite.searchTypesByName(1));
expectType<EveType[]>(sqlite.searchTypesByName('a', 5));
expectError(sqlite.searchTypesByName('a', '5'));
expectType<SolarSystem[]>(sqlite.searchSolarSystemsByName('a'));
expectError(sqlite.searchSolarSystemsByName(1));
expectType<SolarSystem[]>(sqlite.searchSolarSystemsByName('a', 5));
expectError(sqlite.searchSolarSystemsByName('a', '5'));
expectType<Star | null>(sqlite.getStar(1));
expectError(sqlite.getStar('1'));
expectType<Star | null>(sqlite.getStarBySystem(1));
expectError(sqlite.getStarBySystem('1'));
expectType<Planet | null>(sqlite.getPlanet(1));
expectError(sqlite.getPlanet('1'));
expectType<Planet[]>(sqlite.getPlanetsBySystem(1));
expectError(sqlite.getPlanetsBySystem('1'));
expectType<Moon | null>(sqlite.getMoon(1));
expectError(sqlite.getMoon('1'));
expectType<Moon[]>(sqlite.getMoonsBySystem(1));
expectError(sqlite.getMoonsBySystem('1'));
expectType<AsteroidBelt | null>(sqlite.getAsteroidBelt(1));
expectError(sqlite.getAsteroidBelt('1'));
expectType<AsteroidBelt[]>(sqlite.getAsteroidBeltsBySystem(1));
expectError(sqlite.getAsteroidBeltsBySystem('1'));
expectType<Faction | null>(sqlite.getFaction(1));
expectError(sqlite.getFaction('1'));
expectType<Faction[]>(sqlite.getAllFactions());
expectType<Race | null>(sqlite.getRace(1));
expectError(sqlite.getRace('1'));
expectType<Race[]>(sqlite.getAllRaces());
expectType<Bloodline | null>(sqlite.getBloodline(1));
expectError(sqlite.getBloodline('1'));
expectType<Bloodline[]>(sqlite.getBloodlinesByRace(1));
expectError(sqlite.getBloodlinesByRace('1'));
expectType<Ancestry | null>(sqlite.getAncestry(1));
expectError(sqlite.getAncestry('1'));
expectType<Ancestry[]>(sqlite.getAncestriesByBloodline(1));
expectError(sqlite.getAncestriesByBloodline('1'));
expectType<NpcCorporation | null>(sqlite.getNpcCorporation(1));
expectError(sqlite.getNpcCorporation('1'));
expectType<NpcCorporation[]>(sqlite.getNpcCorporationsByFaction(1));
expectError(sqlite.getNpcCorporationsByFaction('1'));
expectType<NpcStation | null>(sqlite.getNpcStation(1));
expectError(sqlite.getNpcStation('1'));
expectType<NpcStation[]>(sqlite.getNpcStationsBySystem(1));
expectError(sqlite.getNpcStationsBySystem('1'));
expectType<NpcStation[]>(sqlite.getNpcStationsByOwner(1));
expectError(sqlite.getNpcStationsByOwner('1'));
expectType<MarketGroup | null>(sqlite.getMarketGroup(1));
expectError(sqlite.getMarketGroup('1'));
expectType<MarketGroup[]>(sqlite.getMarketGroupsByParent(1));
expectError(sqlite.getMarketGroupsByParent('1'));
expectType<MarketGroup[]>(sqlite.getRootMarketGroups());
expectType<EveType[]>(sqlite.getTypesByMarketGroup(1));
expectError(sqlite.getTypesByMarketGroup('1'));
expectType<MarketGroup[]>(sqlite.searchMarketGroupsByName('a'));
expectError(sqlite.searchMarketGroupsByName(1));
expectType<MarketGroup[]>(sqlite.searchMarketGroupsByName('a', 5));
expectError(sqlite.searchMarketGroupsByName('a', '5'));
expectType<MetaGroup | null>(sqlite.getMetaGroup(1));
expectError(sqlite.getMetaGroup('1'));
expectType<MetaGroup[]>(sqlite.getAllMetaGroups());
expectType<Icon | null>(sqlite.getIcon(1));
expectError(sqlite.getIcon('1'));
expectType<Graphic | null>(sqlite.getGraphic(1));
expectError(sqlite.getGraphic('1'));
expectType<DogmaAttribute | null>(sqlite.getDogmaAttribute(1));
expectError(sqlite.getDogmaAttribute('1'));
expectType<DogmaAttribute[]>(sqlite.searchDogmaAttributesByName('a'));
expectError(sqlite.searchDogmaAttributesByName(1));
expectType<DogmaAttribute[]>(sqlite.searchDogmaAttributesByName('a', 5));
expectError(sqlite.searchDogmaAttributesByName('a', '5'));
expectType<DogmaEffect | null>(sqlite.getDogmaEffect(1));
expectError(sqlite.getDogmaEffect('1'));
expectType<DogmaEffect[]>(sqlite.searchDogmaEffectsByName('a'));
expectError(sqlite.searchDogmaEffectsByName(1));
expectType<DogmaEffect[]>(sqlite.searchDogmaEffectsByName('a', 5));
expectError(sqlite.searchDogmaEffectsByName('a', '5'));
expectType<DogmaAttributeCategory | null>(sqlite.getDogmaAttributeCategory(1));
expectError(sqlite.getDogmaAttributeCategory('1'));
expectType<DogmaAttributeCategory[]>(sqlite.getAllDogmaAttributeCategories());
expectType<DogmaUnit | null>(sqlite.getDogmaUnit(1));
expectError(sqlite.getDogmaUnit('1'));
expectType<DogmaUnit[]>(sqlite.getAllDogmaUnits());
expectType<Blueprint | null>(sqlite.getBlueprint(1));
expectError(sqlite.getBlueprint('1'));
expectType<PlanetSchematic | null>(sqlite.getPlanetSchematic(1));
expectError(sqlite.getPlanetSchematic('1'));
expectType<PlanetSchematic[]>(sqlite.getAllPlanetSchematics());
expectType<IndustryActivity | null>(sqlite.getIndustryActivity(1));
expectError(sqlite.getIndustryActivity('1'));
expectType<IndustryActivity[]>(sqlite.getAllIndustryActivities());
expectType<AgentType | null>(sqlite.getAgentType(1));
expectError(sqlite.getAgentType('1'));
expectType<AgentType[]>(sqlite.getAllAgentTypes());
expectType<AgentInSpace | null>(sqlite.getAgentInSpace(1));
expectError(sqlite.getAgentInSpace('1'));
expectType<AgentInSpace[]>(sqlite.getAgentsInSpaceBySystem(1));
expectError(sqlite.getAgentsInSpaceBySystem('1'));
expectType<Certificate | null>(sqlite.getCertificate(1));
expectError(sqlite.getCertificate('1'));
expectType<Certificate[]>(sqlite.getAllCertificates());
expectType<CharacterAttribute | null>(sqlite.getCharacterAttribute(1));
expectError(sqlite.getCharacterAttribute('1'));
expectType<CharacterAttribute[]>(sqlite.getAllCharacterAttributes());
expectType<NpcCharacter | null>(sqlite.getNpcCharacter(1));
expectError(sqlite.getNpcCharacter('1'));
expectType<NpcCharacter[]>(sqlite.getNpcCharactersByCorporation(1));
expectError(sqlite.getNpcCharactersByCorporation('1'));
expectType<NpcCharacter[]>(sqlite.searchNpcCharactersByName('a'));
expectError(sqlite.searchNpcCharactersByName(1));
expectType<NpcCharacter[]>(sqlite.searchNpcCharactersByName('a', 5));
expectError(sqlite.searchNpcCharactersByName('a', '5'));
expectType<CloneGrade | null>(sqlite.getCloneGrade(1));
expectError(sqlite.getCloneGrade('1'));
expectType<CloneGrade[]>(sqlite.getAllCloneGrades());
expectType<CorporationActivity | null>(sqlite.getCorporationActivity(1));
expectError(sqlite.getCorporationActivity('1'));
expectType<CorporationActivity[]>(sqlite.getAllCorporationActivities());
expectType<NpcCorporationDivision | null>(sqlite.getNpcCorporationDivision(1));
expectError(sqlite.getNpcCorporationDivision('1'));
expectType<NpcCorporationDivision[]>(sqlite.getAllNpcCorporationDivisions());
expectType<Landmark | null>(sqlite.getLandmark(1));
expectError(sqlite.getLandmark('1'));
expectType<Landmark[]>(sqlite.getAllLandmarks());
expectType<NotificationType | null>(sqlite.getNotificationType(1));
expectError(sqlite.getNotificationType('1'));
expectType<School | null>(sqlite.getSchool(1));
expectError(sqlite.getSchool('1'));
expectType<School[]>(sqlite.getAllSchools());
expectType<SecondarySun | null>(sqlite.getSecondarySun(1));
expectError(sqlite.getSecondarySun('1'));
expectType<SecondarySun[]>(sqlite.getSecondarySunsBySystem(1));
expectError(sqlite.getSecondarySunsBySystem('1'));
expectType<Skin | null>(sqlite.getSkin(1));
expectError(sqlite.getSkin('1'));
expectType<SkinLicense | null>(sqlite.getSkinLicense(1));
expectError(sqlite.getSkinLicense('1'));
expectType<SkinLicense[]>(sqlite.getSkinLicensesBySkin(1));
expectError(sqlite.getSkinLicensesBySkin('1'));
expectType<StationOperation | null>(sqlite.getStationOperation(1));
expectError(sqlite.getStationOperation('1'));
expectType<StationOperation[]>(sqlite.getAllStationOperations());
expectType<StationService | null>(sqlite.getStationService(1));
expectError(sqlite.getStationService('1'));
expectType<StationService[]>(sqlite.getAllStationServices());
expectType<TypeDogma | null>(sqlite.getTypeDogma(1));
expectError(sqlite.getTypeDogma('1'));
expectType<TypeMaterial | null>(sqlite.getTypeMaterial(1));
expectError(sqlite.getTypeMaterial('1'));
expectType<TypeBonus | null>(sqlite.getTypeBonus(1));
expectError(sqlite.getTypeBonus('1'));
expectType<Mission | null>(sqlite.getMission(1));
expectError(sqlite.getMission('1'));
expectType<Dungeon | null>(sqlite.getDungeon(1));
expectError(sqlite.getDungeon('1'));
expectType<EpicArc | null>(sqlite.getEpicArc(1));
expectError(sqlite.getEpicArc('1'));
expectType<EpicArc[]>(sqlite.getAllEpicArcs());
expectType<Record<string, unknown> | null>(sqlite.getEntity('eve_types', 34));
expectType<Record<string, unknown> | null>(
  sqlite.getEntity('eve_landmarks', 'a'),
);
expectType<EveType | null>(sqlite.getEntity<EveType>('eve_types', 34));
expectError(sqlite.getEntity('eve_types', true));
expectError(sqlite.getEntity(34, 34));
expectType<Record<string, unknown>[]>(sqlite.getAllEntities('eve_types'));
expectType<EveType[]>(sqlite.getAllEntities<EveType>('eve_types'));
expectError(sqlite.getAllEntities(34));
expectType<SdeVersionInfo>(sqlite.getVersion());
expectType<void>(sqlite.close());

declare const memory: MemorySdeProvider;
expectType<EveType | null>(memory.getType(1));
expectError(memory.getType('1'));
expectType<EveType[]>(memory.getTypesByGroup(1));
expectError(memory.getTypesByGroup('1'));
expectType<EveGroup | null>(memory.getGroup(1));
expectError(memory.getGroup('1'));
expectType<EveGroup[]>(memory.getGroupsByCategory(1));
expectError(memory.getGroupsByCategory('1'));
expectType<EveCategory | null>(memory.getCategory(1));
expectError(memory.getCategory('1'));
expectType<EveCategory[]>(memory.getAllCategories());
expectType<Region | null>(memory.getRegion(1));
expectError(memory.getRegion('1'));
expectType<Region[]>(memory.getAllRegions());
expectType<Constellation | null>(memory.getConstellation(1));
expectError(memory.getConstellation('1'));
expectType<Constellation[]>(memory.getConstellationsByRegion(1));
expectError(memory.getConstellationsByRegion('1'));
expectType<SolarSystem | null>(memory.getSolarSystem(1));
expectError(memory.getSolarSystem('1'));
expectType<SolarSystem[]>(memory.getSolarSystemsByConstellation(1));
expectError(memory.getSolarSystemsByConstellation('1'));
expectType<Stargate | null>(memory.getStargate(1));
expectError(memory.getStargate('1'));
expectType<Stargate[]>(memory.getStargatesBySystem(1));
expectError(memory.getStargatesBySystem('1'));
expectType<EveType[]>(memory.searchTypesByName('a'));
expectError(memory.searchTypesByName(1));
expectType<EveType[]>(memory.searchTypesByName('a', 5));
expectError(memory.searchTypesByName('a', '5'));
expectType<SolarSystem[]>(memory.searchSolarSystemsByName('a'));
expectError(memory.searchSolarSystemsByName(1));
expectType<SolarSystem[]>(memory.searchSolarSystemsByName('a', 5));
expectError(memory.searchSolarSystemsByName('a', '5'));
expectType<Star | null>(memory.getStar(1));
expectError(memory.getStar('1'));
expectType<Star | null>(memory.getStarBySystem(1));
expectError(memory.getStarBySystem('1'));
expectType<Planet | null>(memory.getPlanet(1));
expectError(memory.getPlanet('1'));
expectType<Planet[]>(memory.getPlanetsBySystem(1));
expectError(memory.getPlanetsBySystem('1'));
expectType<Moon | null>(memory.getMoon(1));
expectError(memory.getMoon('1'));
expectType<Moon[]>(memory.getMoonsBySystem(1));
expectError(memory.getMoonsBySystem('1'));
expectType<AsteroidBelt | null>(memory.getAsteroidBelt(1));
expectError(memory.getAsteroidBelt('1'));
expectType<AsteroidBelt[]>(memory.getAsteroidBeltsBySystem(1));
expectError(memory.getAsteroidBeltsBySystem('1'));
expectType<Faction | null>(memory.getFaction(1));
expectError(memory.getFaction('1'));
expectType<Faction[]>(memory.getAllFactions());
expectType<Race | null>(memory.getRace(1));
expectError(memory.getRace('1'));
expectType<Race[]>(memory.getAllRaces());
expectType<Bloodline | null>(memory.getBloodline(1));
expectError(memory.getBloodline('1'));
expectType<Bloodline[]>(memory.getBloodlinesByRace(1));
expectError(memory.getBloodlinesByRace('1'));
expectType<Ancestry | null>(memory.getAncestry(1));
expectError(memory.getAncestry('1'));
expectType<Ancestry[]>(memory.getAncestriesByBloodline(1));
expectError(memory.getAncestriesByBloodline('1'));
expectType<NpcCorporation | null>(memory.getNpcCorporation(1));
expectError(memory.getNpcCorporation('1'));
expectType<NpcCorporation[]>(memory.getNpcCorporationsByFaction(1));
expectError(memory.getNpcCorporationsByFaction('1'));
expectType<NpcStation | null>(memory.getNpcStation(1));
expectError(memory.getNpcStation('1'));
expectType<NpcStation[]>(memory.getNpcStationsBySystem(1));
expectError(memory.getNpcStationsBySystem('1'));
expectType<NpcStation[]>(memory.getNpcStationsByOwner(1));
expectError(memory.getNpcStationsByOwner('1'));
expectType<MarketGroup | null>(memory.getMarketGroup(1));
expectError(memory.getMarketGroup('1'));
expectType<MarketGroup[]>(memory.getMarketGroupsByParent(1));
expectError(memory.getMarketGroupsByParent('1'));
expectType<MarketGroup[]>(memory.getRootMarketGroups());
expectType<EveType[]>(memory.getTypesByMarketGroup(1));
expectError(memory.getTypesByMarketGroup('1'));
expectType<MarketGroup[]>(memory.searchMarketGroupsByName('a'));
expectError(memory.searchMarketGroupsByName(1));
expectType<MarketGroup[]>(memory.searchMarketGroupsByName('a', 5));
expectError(memory.searchMarketGroupsByName('a', '5'));
expectType<MetaGroup | null>(memory.getMetaGroup(1));
expectError(memory.getMetaGroup('1'));
expectType<MetaGroup[]>(memory.getAllMetaGroups());
expectType<Icon | null>(memory.getIcon(1));
expectError(memory.getIcon('1'));
expectType<Graphic | null>(memory.getGraphic(1));
expectError(memory.getGraphic('1'));
expectType<DogmaAttribute | null>(memory.getDogmaAttribute(1));
expectError(memory.getDogmaAttribute('1'));
expectType<DogmaAttribute[]>(memory.searchDogmaAttributesByName('a'));
expectError(memory.searchDogmaAttributesByName(1));
expectType<DogmaAttribute[]>(memory.searchDogmaAttributesByName('a', 5));
expectError(memory.searchDogmaAttributesByName('a', '5'));
expectType<DogmaEffect | null>(memory.getDogmaEffect(1));
expectError(memory.getDogmaEffect('1'));
expectType<DogmaEffect[]>(memory.searchDogmaEffectsByName('a'));
expectError(memory.searchDogmaEffectsByName(1));
expectType<DogmaEffect[]>(memory.searchDogmaEffectsByName('a', 5));
expectError(memory.searchDogmaEffectsByName('a', '5'));
expectType<DogmaAttributeCategory | null>(memory.getDogmaAttributeCategory(1));
expectError(memory.getDogmaAttributeCategory('1'));
expectType<DogmaAttributeCategory[]>(memory.getAllDogmaAttributeCategories());
expectType<DogmaUnit | null>(memory.getDogmaUnit(1));
expectError(memory.getDogmaUnit('1'));
expectType<DogmaUnit[]>(memory.getAllDogmaUnits());
expectType<Blueprint | null>(memory.getBlueprint(1));
expectError(memory.getBlueprint('1'));
expectType<PlanetSchematic | null>(memory.getPlanetSchematic(1));
expectError(memory.getPlanetSchematic('1'));
expectType<PlanetSchematic[]>(memory.getAllPlanetSchematics());
expectType<IndustryActivity | null>(memory.getIndustryActivity(1));
expectError(memory.getIndustryActivity('1'));
expectType<IndustryActivity[]>(memory.getAllIndustryActivities());
expectType<AgentType | null>(memory.getAgentType(1));
expectError(memory.getAgentType('1'));
expectType<AgentType[]>(memory.getAllAgentTypes());
expectType<AgentInSpace | null>(memory.getAgentInSpace(1));
expectError(memory.getAgentInSpace('1'));
expectType<AgentInSpace[]>(memory.getAgentsInSpaceBySystem(1));
expectError(memory.getAgentsInSpaceBySystem('1'));
expectType<Certificate | null>(memory.getCertificate(1));
expectError(memory.getCertificate('1'));
expectType<Certificate[]>(memory.getAllCertificates());
expectType<CharacterAttribute | null>(memory.getCharacterAttribute(1));
expectError(memory.getCharacterAttribute('1'));
expectType<CharacterAttribute[]>(memory.getAllCharacterAttributes());
expectType<NpcCharacter | null>(memory.getNpcCharacter(1));
expectError(memory.getNpcCharacter('1'));
expectType<NpcCharacter[]>(memory.getNpcCharactersByCorporation(1));
expectError(memory.getNpcCharactersByCorporation('1'));
expectType<NpcCharacter[]>(memory.searchNpcCharactersByName('a'));
expectError(memory.searchNpcCharactersByName(1));
expectType<NpcCharacter[]>(memory.searchNpcCharactersByName('a', 5));
expectError(memory.searchNpcCharactersByName('a', '5'));
expectType<CloneGrade | null>(memory.getCloneGrade(1));
expectError(memory.getCloneGrade('1'));
expectType<CloneGrade[]>(memory.getAllCloneGrades());
expectType<CorporationActivity | null>(memory.getCorporationActivity(1));
expectError(memory.getCorporationActivity('1'));
expectType<CorporationActivity[]>(memory.getAllCorporationActivities());
expectType<NpcCorporationDivision | null>(memory.getNpcCorporationDivision(1));
expectError(memory.getNpcCorporationDivision('1'));
expectType<NpcCorporationDivision[]>(memory.getAllNpcCorporationDivisions());
expectType<Landmark | null>(memory.getLandmark(1));
expectError(memory.getLandmark('1'));
expectType<Landmark[]>(memory.getAllLandmarks());
expectType<NotificationType | null>(memory.getNotificationType(1));
expectError(memory.getNotificationType('1'));
expectType<School | null>(memory.getSchool(1));
expectError(memory.getSchool('1'));
expectType<School[]>(memory.getAllSchools());
expectType<SecondarySun | null>(memory.getSecondarySun(1));
expectError(memory.getSecondarySun('1'));
expectType<SecondarySun[]>(memory.getSecondarySunsBySystem(1));
expectError(memory.getSecondarySunsBySystem('1'));
expectType<Skin | null>(memory.getSkin(1));
expectError(memory.getSkin('1'));
expectType<SkinLicense | null>(memory.getSkinLicense(1));
expectError(memory.getSkinLicense('1'));
expectType<SkinLicense[]>(memory.getSkinLicensesBySkin(1));
expectError(memory.getSkinLicensesBySkin('1'));
expectType<StationOperation | null>(memory.getStationOperation(1));
expectError(memory.getStationOperation('1'));
expectType<StationOperation[]>(memory.getAllStationOperations());
expectType<StationService | null>(memory.getStationService(1));
expectError(memory.getStationService('1'));
expectType<StationService[]>(memory.getAllStationServices());
expectType<TypeDogma | null>(memory.getTypeDogma(1));
expectError(memory.getTypeDogma('1'));
expectType<TypeMaterial | null>(memory.getTypeMaterial(1));
expectError(memory.getTypeMaterial('1'));
expectType<TypeBonus | null>(memory.getTypeBonus(1));
expectError(memory.getTypeBonus('1'));
expectType<Mission | null>(memory.getMission(1));
expectError(memory.getMission('1'));
expectType<Dungeon | null>(memory.getDungeon(1));
expectError(memory.getDungeon('1'));
expectType<EpicArc | null>(memory.getEpicArc(1));
expectError(memory.getEpicArc('1'));
expectType<EpicArc[]>(memory.getAllEpicArcs());
expectType<Record<string, unknown> | null>(memory.getEntity('eve_types', 34));
expectType<Record<string, unknown> | null>(
  memory.getEntity('eve_landmarks', 'a'),
);
expectType<EveType | null>(memory.getEntity<EveType>('eve_types', 34));
expectError(memory.getEntity('eve_types', true));
expectError(memory.getEntity(34, 34));
expectType<Record<string, unknown>[]>(memory.getAllEntities('eve_types'));
expectType<EveType[]>(memory.getAllEntities<EveType>('eve_types'));
expectError(memory.getAllEntities(34));
expectType<SdeVersionInfo>(memory.getVersion());
expectType<void>(memory.close());

// --- MemorySdeData keys are the entity families ---

declare const data: MemorySdeData;
expectType<EveType[] | undefined>(data.types);
expectType<EveGroup[] | undefined>(data.groups);
expectType<EveCategory[] | undefined>(data.categories);
expectType<Region[] | undefined>(data.regions);
expectType<Constellation[] | undefined>(data.constellations);
expectType<SolarSystem[] | undefined>(data.solarSystems);
expectType<Stargate[] | undefined>(data.stargates);
expectType<Star[] | undefined>(data.stars);
expectType<Planet[] | undefined>(data.planets);
expectType<Moon[] | undefined>(data.moons);
expectType<AsteroidBelt[] | undefined>(data.asteroidBelts);
expectType<Faction[] | undefined>(data.factions);
expectType<Race[] | undefined>(data.races);
expectType<Bloodline[] | undefined>(data.bloodlines);
expectType<Ancestry[] | undefined>(data.ancestries);
expectType<NpcCorporation[] | undefined>(data.npcCorporations);
expectType<NpcStation[] | undefined>(data.npcStations);
expectType<MarketGroup[] | undefined>(data.marketGroups);
expectType<MetaGroup[] | undefined>(data.metaGroups);
expectType<Icon[] | undefined>(data.icons);
expectType<Graphic[] | undefined>(data.graphics);
expectType<DogmaAttribute[] | undefined>(data.dogmaAttributes);
expectType<DogmaEffect[] | undefined>(data.dogmaEffects);
expectType<Blueprint[] | undefined>(data.blueprints);
expectType<PlanetSchematic[] | undefined>(data.planetSchematics);
expectType<AgentType[] | undefined>(data.agentTypes);
expectType<AgentInSpace[] | undefined>(data.agentsInSpace);
expectType<Certificate[] | undefined>(data.certificates);
expectType<CharacterAttribute[] | undefined>(data.characterAttributes);
expectType<CloneGrade[] | undefined>(data.cloneGrades);
expectType<CorporationActivity[] | undefined>(data.corporationActivities);
expectType<DogmaAttributeCategory[] | undefined>(data.dogmaAttributeCategories);
expectType<DogmaUnit[] | undefined>(data.dogmaUnits);
expectType<IndustryActivity[] | undefined>(data.industryActivities);
expectType<Landmark[] | undefined>(data.landmarks);
expectType<NotificationType[] | undefined>(data.notificationTypes);
expectType<NpcCharacter[] | undefined>(data.npcCharacters);
expectType<NpcCorporationDivision[] | undefined>(data.npcCorporationDivisions);
expectType<School[] | undefined>(data.schools);
expectType<SecondarySun[] | undefined>(data.secondarySuns);
expectType<Skin[] | undefined>(data.skins);
expectType<SkinLicense[] | undefined>(data.skinLicenses);
expectType<StationOperation[] | undefined>(data.stationOperations);
expectType<StationService[] | undefined>(data.stationServices);
expectType<TypeDogma[] | undefined>(data.typeDogma);
expectType<TypeMaterial[] | undefined>(data.typeMaterials);
expectType<TypeBonus[] | undefined>(data.typeBonuses);
expectType<Mission[] | undefined>(data.missions);
expectType<Dungeon[] | undefined>(data.dungeons);
expectType<EpicArc[] | undefined>(data.epicArcs);
expectType<Partial<SdeVersionInfo> | undefined>(data.version);
declare const dataKey: keyof MemorySdeData;
expectType<
  | 'types'
  | 'groups'
  | 'categories'
  | 'regions'
  | 'constellations'
  | 'solarSystems'
  | 'stargates'
  | 'stars'
  | 'planets'
  | 'moons'
  | 'asteroidBelts'
  | 'factions'
  | 'races'
  | 'bloodlines'
  | 'ancestries'
  | 'npcCorporations'
  | 'npcStations'
  | 'marketGroups'
  | 'metaGroups'
  | 'icons'
  | 'graphics'
  | 'dogmaAttributes'
  | 'dogmaEffects'
  | 'blueprints'
  | 'planetSchematics'
  | 'agentTypes'
  | 'agentsInSpace'
  | 'certificates'
  | 'characterAttributes'
  | 'cloneGrades'
  | 'corporationActivities'
  | 'dogmaAttributeCategories'
  | 'dogmaUnits'
  | 'industryActivities'
  | 'landmarks'
  | 'notificationTypes'
  | 'npcCharacters'
  | 'npcCorporationDivisions'
  | 'schools'
  | 'secondarySuns'
  | 'skins'
  | 'skinLicenses'
  | 'stationOperations'
  | 'stationServices'
  | 'typeDogma'
  | 'typeMaterials'
  | 'typeBonuses'
  | 'missions'
  | 'dungeons'
  | 'epicArcs'
  | 'version'
>(dataKey);
expectNotAssignable<MemorySdeData>({ nothing: [] });
expectAssignable<MemorySdeData>({});
expectAssignable<MemorySdeData>({ types: [], version: { version: '1' } });

// --- Error guards narrow ---

declare const caught: unknown;
if (isSdeError(caught)) {
  expectType<SdeError>(caught);
  expectType<string>(caught.message);
  expectType<string>(caught.name);
}
if (isSdeDatabaseError(caught)) {
  expectType<SdeDatabaseError>(caught);
  expectType<unknown>(caught.cause);
}
if (isSdeValidationError(caught)) {
  expectType<SdeValidationError>(caught);
  expectType<string>(caught.entityType);
  expectType<unknown>(caught.validationError);
  expectType<number | undefined>(caught.entityId);
}
if (isSdeVersionMismatch(caught)) {
  expectType<SdeVersionMismatchError>(caught);
  expectType<string>(caught.expected);
  expectType<string>(caught.actual);
}
expectAssignable<SdeError>(new SdeDatabaseError('db', new Error('cause')));
expectAssignable<SdeError>(new SdeValidationError('eve_types', {}, 34));
expectAssignable<SdeError>(new SdeVersionMismatchError('1', '2'));
expectAssignable<Error>(new SdeError('x'));
expectError(new SdeError());
expectError(new SdeVersionMismatchError('1'));
expectError(new SdeValidationError('eve_types'));

// --- Version record ---

declare const version: SdeVersionInfo;
expectType<string>(version.version);
expectType<string>(version.buildDate);
expectType<string>(version.importedAt);
expectType<string | undefined>(version.checksum);
expectAssignable<SdeVersionInfo>({
  version: '1',
  buildDate: 'd',
  importedAt: 'i',
});
expectNotAssignable<SdeVersionInfo>({ version: '1' });

// --- Every exported entity type carries its identifying field ---

declare const position3DRecord: Position3D;
expectType<number>(position3DRecord.x);
declare const position2DRecord: Position2D;
expectType<number>(position2DRecord.x);
declare const starStatisticsRecord: StarStatistics;
expectType<number>(starStatisticsRecord.age);
declare const stargateDestinationRecord: StargateDestination;
expectType<number>(stargateDestinationRecord.solarSystemId);
declare const blueprintMaterialRecord: BlueprintMaterial;
expectType<number>(blueprintMaterialRecord.typeId);
declare const blueprintProductRecord: BlueprintProduct;
expectType<number>(blueprintProductRecord.typeId);
declare const blueprintActivityRecord: BlueprintActivity;
expectType<number>(blueprintActivityRecord.time);
declare const blueprintActivitiesRecord: BlueprintActivities;
expectType<BlueprintActivity | undefined>(
  blueprintActivitiesRecord.manufacturing,
);
declare const accountingEntryTypeRecord: AccountingEntryType;
expectType<number>(accountingEntryTypeRecord.accountingEntryTypeId);
declare const agentTypeRecord: AgentType;
expectType<number>(agentTypeRecord.agentTypeId);
declare const agentInSpaceRecord: AgentInSpace;
expectType<number>(agentInSpaceRecord.characterId);
declare const ancestryRecord: Ancestry;
expectType<number>(ancestryRecord.ancestryId);
declare const appliedProximityEffectRecord: AppliedProximityEffect;
expectType<number>(appliedProximityEffectRecord.appliedProximityEffectId);
declare const archetypeRecord: Archetype;
expectType<number>(archetypeRecord.archetypeId);
declare const asteroidBeltRecord: AsteroidBelt;
expectType<number>(asteroidBeltRecord.asteroidBeltId);
declare const bloodlineRecord: Bloodline;
expectType<number>(bloodlineRecord.bloodlineId);
declare const blueprintRecord: Blueprint;
expectType<number>(blueprintRecord.blueprintTypeId);
expectType<BlueprintActivities>(blueprintRecord.activities);
declare const eveCategoryRecord: EveCategory;
expectType<number>(eveCategoryRecord.categoryId);
declare const certificateRecord: Certificate;
expectType<number>(certificateRecord.certificateId);
declare const characterAttributeRecord: CharacterAttribute;
expectType<number>(characterAttributeRecord.attributeId);
declare const characterTitleRecord: CharacterTitle;
expectType<string>(characterTitleRecord.name);
declare const cloneGradeRecord: CloneGrade;
expectType<number>(cloneGradeRecord.cloneGradeId);
declare const compressibleTypeRecord: CompressibleType;
expectType<number>(compressibleTypeRecord.typeId);
declare const constellationRecord: Constellation;
expectType<number>(constellationRecord.constellationId);
declare const contrabandTypeRecord: ContrabandType;
expectType<number>(contrabandTypeRecord.typeId);
declare const controlTowerResourceRecord: ControlTowerResource;
expectType<number>(controlTowerResourceRecord.typeId);
declare const corporationActivityRecord: CorporationActivity;
expectType<number>(corporationActivityRecord.corporationActivityId);
declare const corporationRoleGroupRecord: CorporationRoleGroup;
expectType<number>(corporationRoleGroupRecord.corporationRoleGroupId);
declare const corporationRoleRecord: CorporationRole;
expectType<number>(corporationRoleRecord.corporationRoleId);
declare const dbuffCollectionRecord: DbuffCollection;
expectType<number>(dbuffCollectionRecord.dbuffCollectionId);
declare const dogmaAttributeCategoryRecord: DogmaAttributeCategory;
expectType<number>(dogmaAttributeCategoryRecord.attributeCategoryId);
declare const dogmaAttributeRecord: DogmaAttribute;
expectType<number>(dogmaAttributeRecord.attributeId);
declare const dogmaEffectRecord: DogmaEffect;
expectType<number>(dogmaEffectRecord.effectId);
declare const dogmaUnitRecord: DogmaUnit;
expectType<number>(dogmaUnitRecord.unitId);
declare const dungeonRecord: Dungeon;
expectType<number>(dungeonRecord.dungeonId);
declare const dynamicItemAttributeRecord: DynamicItemAttribute;
expectType<number>(dynamicItemAttributeRecord.dynamicItemAttributeId);
declare const epicArcRecord: EpicArc;
expectType<number>(epicArcRecord.epicArcId);
declare const expertSystemRecord: ExpertSystem;
expectType<number>(expertSystemRecord.expertSystemId);
declare const factionRecord: Faction;
expectType<number>(factionRecord.factionId);
declare const fighterAbilityRecord: FighterAbility;
expectType<number>(fighterAbilityRecord.fighterAbilityId);
declare const fighterAbilityByTypeRecord: FighterAbilityByType;
expectType<number>(fighterAbilityByTypeRecord.typeId);
declare const freelanceJobSchemaRecord: FreelanceJobSchema;
expectType<number>(freelanceJobSchemaRecord.freelanceJobSchemaGroupId);
declare const graphicMaterialSetRecord: GraphicMaterialSet;
expectType<number>(graphicMaterialSetRecord.materialSetId);
declare const graphicRecord: Graphic;
expectType<number>(graphicRecord.graphicId);
declare const eveGroupRecord: EveGroup;
expectType<number>(eveGroupRecord.groupId);
declare const iconRecord: Icon;
expectType<number>(iconRecord.iconId);
declare const industryActivityRecord: IndustryActivity;
expectType<number>(industryActivityRecord.industryActivityId);
declare const industryAssemblyLineRecord: IndustryAssemblyLine;
expectType<number>(industryAssemblyLineRecord.assemblyLineId);
declare const industryInstallationTypeRecord: IndustryInstallationType;
expectType<number>(industryInstallationTypeRecord.installationTypeId);
declare const industryModifierSourceRecord: IndustryModifierSource;
expectType<number>(industryModifierSourceRecord.modifierSourceId);
declare const industryTargetFilterRecord: IndustryTargetFilter;
expectType<number>(industryTargetFilterRecord.targetFilterId);
declare const landmarkRecord: Landmark;
expectType<number>(landmarkRecord.landmarkId);
declare const linkWithShipRecord: LinkWithShip;
expectType<number>(linkWithShipRecord.linkWithShipId);
declare const marketGroupRecord: MarketGroup;
expectType<number>(marketGroupRecord.marketGroupId);
declare const masteryRecord: Mastery;
expectType<number>(masteryRecord.typeId);
declare const mercenaryTacticalOperationRecord: MercenaryTacticalOperation;
expectType<number>(
  mercenaryTacticalOperationRecord.mercenaryTacticalOperationId,
);
declare const metaGroupRecord: MetaGroup;
expectType<number>(metaGroupRecord.metaGroupId);
declare const metenoxMoonDrillRecord: MetenoxMoonDrill;
expectType<number>(metenoxMoonDrillRecord.metenoxMoonDrillId);
declare const militaryCampaignObjectiveRecord: MilitaryCampaignObjective;
expectType<string>(militaryCampaignObjectiveRecord.militaryCampaignObjectiveId);
declare const militaryCampaignRecord: MilitaryCampaign;
expectType<string>(militaryCampaignRecord.militaryCampaignId);
declare const missionRecord: Mission;
expectType<number>(missionRecord.missionId);
declare const moonRecord: Moon;
expectType<number>(moonRecord.moonId);
declare const notificationTypeRecord: NotificationType;
expectType<number>(notificationTypeRecord.notificationTypeId);
declare const npcCharacterRecord: NpcCharacter;
expectType<number>(npcCharacterRecord.characterId);
declare const npcCorporationDivisionRecord: NpcCorporationDivision;
expectType<number>(npcCorporationDivisionRecord.npcCorporationDivisionId);
declare const npcCorporationRecord: NpcCorporation;
expectType<number>(npcCorporationRecord.corporationId);
declare const npcStationRecord: NpcStation;
expectType<number>(npcStationRecord.stationId);
declare const planetResourceRecord: PlanetResource;
expectType<number>(planetResourceRecord.planetId);
declare const planetSchematicRecord: PlanetSchematic;
expectType<number>(planetSchematicRecord.planetSchematicId);
declare const planetRecord: Planet;
expectType<number>(planetRecord.planetId);
declare const proximityTrapRecord: ProximityTrap;
expectType<number>(proximityTrapRecord.proximityTrapId);
declare const raceRecord: Race;
expectType<number>(raceRecord.raceId);
declare const regionRecord: Region;
expectType<number>(regionRecord.regionId);
declare const schoolMapRecord: SchoolMap;
expectType<number>(schoolMapRecord.schoolMapId);
declare const schoolRecord: School;
expectType<number>(schoolRecord.schoolId);
declare const secondarySunRecord: SecondarySun;
expectType<number>(secondarySunRecord.secondarySunId);
declare const shipTreeElementRecord: ShipTreeElement;
expectType<number>(shipTreeElementRecord.shipTreeElementId);
declare const shipTreeFactionRecord: ShipTreeFaction;
expectType<number>(shipTreeFactionRecord.factionId);
declare const shipTreeGroupRecord: ShipTreeGroup;
expectType<number>(shipTreeGroupRecord.shipTreeGroupId);
declare const skillPlanRecord: SkillPlan;
expectType<number>(skillPlanRecord.skillPlanId);
declare const skinLicenseRecord: SkinLicense;
expectType<number>(skinLicenseRecord.licenseTypeId);
expectType<number>(skinLicenseRecord.duration);
declare const skinMaterialRecord: SkinMaterial;
expectType<string>(skinMaterialRecord.displayName);
declare const skinrComponentCategoryRecord: SkinrComponentCategory;
expectType<number>(skinrComponentCategoryRecord.skinrComponentCategoryId);
declare const skinrComponentRarityRecord: SkinrComponentRarity;
expectType<number>(skinrComponentRarityRecord.skinrComponentRarityId);
declare const skinrComponentRecord: SkinrComponent;
expectType<number>(skinrComponentRecord.skinrComponentId);
declare const skinrSlotCategoryRecord: SkinrSlotCategory;
expectType<number>(skinrSlotCategoryRecord.skinrSlotCategoryId);
declare const skinrSlotConfigurationRecord: SkinrSlotConfiguration;
expectType<number>(skinrSlotConfigurationRecord.skinrSlotConfigurationId);
declare const skinrSlotNameRecord: SkinrSlotName;
expectType<number>(skinrSlotNameRecord.skinrSlotNameId);
declare const skinrSlotRecord: SkinrSlot;
expectType<number>(skinrSlotRecord.skinrSlotId);
declare const skinrSlotToMaterialRecord: SkinrSlotToMaterial;
expectType<number>(skinrSlotToMaterialRecord.skinrSlotToMaterialId);
declare const skinRecord: Skin;
expectType<number>(skinRecord.skinId);
declare const solarSystemRecord: SolarSystem;
expectType<number>(solarSystemRecord.systemId);
declare const sovereigntyUpgradeRecord: SovereigntyUpgrade;
expectType<number>(sovereigntyUpgradeRecord.typeId);
declare const stargateRecord: Stargate;
expectType<number>(stargateRecord.stargateId);
declare const starRecord: Star;
expectType<number>(starRecord.starId);
declare const stationOperationRecord: StationOperation;
expectType<number>(stationOperationRecord.stationOperationId);
declare const stationServiceRecord: StationService;
expectType<number>(stationServiceRecord.stationServiceId);
declare const stationStandingsRestrictionRecord: StationStandingsRestriction;
expectType<number>(
  stationStandingsRestrictionRecord.stationStandingsRestrictionId,
);
declare const systemDbuffEmitterRecord: SystemDbuffEmitter;
expectType<number>(systemDbuffEmitterRecord.systemDbuffEmitterId);
declare const systemWideEffectRecord: SystemWideEffect;
expectType<number>(systemWideEffectRecord.systemWideEffectId);
declare const translationLanguageRecord: TranslationLanguage;
expectType<string>(translationLanguageRecord.translationLanguageId);
declare const typeBonusRecord: TypeBonus;
expectType<number>(typeBonusRecord.typeId);
declare const typeDogmaRecord: TypeDogma;
expectType<number>(typeDogmaRecord.typeId);
declare const typeElementRecord: TypeElement;
expectType<number>(typeElementRecord.typeId);
declare const typeListRecord: TypeList;
expectType<number>(typeListRecord.typeListId);
declare const typeMaterialRecord: TypeMaterial;
expectType<number>(typeMaterialRecord.typeId);
declare const eveTypeRecord: EveType;
expectType<number>(eveTypeRecord.typeId);

declare const skinrComponentPointValueRecord: SkinrComponentPointValue;
expectType<number>(skinrComponentPointValueRecord['1']);
declare const skinrTierThresholdRecord: SkinrTierThreshold;
expectType<number>(skinrTierThresholdRecord['4']);

// --- Fields every record of a table carries ---
// A field CCP always writes stays required, and a nullable one keeps both
// members, so a declaration that loosens either fails here.

expectType<string>(characterAttributeRecord.name);
expectType<string>(characterAttributeRecord.notes);
expectType<number>(expertSystemRecord.durationDays);
expectType<number | null>(npcCharacterRecord.careerId);
expectType<number>(raceRecord.shipTypeId);
expectType<number>(schoolRecord.careerId);
expectType<number>(schoolRecord.raceId);
expectType<string>(militaryCampaignObjectiveRecord.campaignId);
expectType<string>(militaryCampaignObjectiveRecord.careerPath);
expectType<string>(militaryCampaignObjectiveRecord.title);
expectType<string>(notificationTypeRecord.internalName);
expectType<string | null>(npcCorporationDivisionRecord.description);
expectType<boolean>(npcCorporationRecord.hasPlayerPersonnelManager);
expectType<string>(npcCorporationRecord.name);
expectType<boolean>(npcCorporationRecord.sendCharTerminationMessage);
expectType<number | null>(npcCorporationRecord.friendId);
expectType<number | null>(npcCorporationRecord.iconId);
expectType<number | null>(npcCorporationRecord.solarSystemId);
expectType<number | null>(dogmaEffectRecord.falloffAttributeId);
expectType<number | null>(dogmaEffectRecord.rangeAttributeId);
expectType<string | null>(dogmaEffectRecord.description);
expectType<string>(industryActivityRecord.name);
expectType<string>(industryTargetFilterRecord.name);
expectType<string | null>(accountingEntryTypeRecord.description);
expectType<number>(skinrComponentRarityRecord.rank);
expectType<string>(skinrComponentRecord.projectionTypeU);
expectType<string>(skinrSlotCategoryRecord.name);
expectType<boolean>(skinrSlotConfigurationRecord.allowAllShips);
expectType<boolean>(skinRecord.visibleTranquility);
expectType<boolean>(eveCategoryRecord.published);
expectType<number | null>(eveCategoryRecord.iconId);
expectType<boolean>(fighterAbilityRecord.disallowInHighSec);
expectType<number | null>(fighterAbilityRecord.turretGraphicId);
expectType<boolean>(eveGroupRecord.fittableNonSingleton);
expectType<number | null>(eveGroupRecord.iconId);
expectType<boolean>(linkWithShipRecord.applyPvpFlag);
expectType<string | null>(metaGroupRecord.iconSuffix);
expectType<string>(shipTreeFactionRecord.icon);
expectType<string>(shipTreeGroupRecord.icon);
expectType<number | null>(eveTypeRecord.volume);
expectType<number | null>(eveTypeRecord.graphicId);
expectType<number | null>(eveTypeRecord.iconId);
expectType<boolean | null>(eveTypeRecord.isRepackable);
expectType<number>(starStatisticsRecord.life);
expectType<number>(asteroidBeltRecord.radius);
expectType<number>(secondarySunRecord.typeId);
expectType<number>(solarSystemRecord.securityStatus);
expectType<string>(sovereigntyUpgradeRecord.mutually_exclusive_group);
expectType<number | null>(sovereigntyUpgradeRecord.power_production);
expectType<number>(starRecord.typeId);

// --- Lookups take their key ---

declare const sdeProvider: IStaticDataProvider;
expectError(sdeProvider.getType());
expectError(sdeProvider.searchTypesByName());
expectError(sdeProvider.getCertificate());
expectError(sdeProvider.getCharacterAttribute());
expectError(sdeProvider.getNpcCharacter());
expectError(sdeProvider.getSecondarySun());
expectError(sdeProvider.getSkinLicensesBySkin());
expectError(sdeProvider.getStationOperation());
declare const yamlProvider: SdeDataProvider;
expectError(yamlProvider.getRace());
expectError(yamlProvider.getAncestry());
expectError(yamlProvider.getNpcStationsBySystem());
expectError(yamlProvider.searchMarketGroupsByName());
expectError(yamlProvider.getGraphic());
expectError(yamlProvider.getCloneGrade());
expectError(yamlProvider.getSecondarySunsBySystem());

// --- Test data factory ---

expectType<EveType>(SdeTestDataFactory.createEveType());
expectType<EveGroup>(SdeTestDataFactory.createEveGroup());
expectType<EveType>(SdeTestDataFactory.createEveType({ typeId: 34 }));
expectError(SdeTestDataFactory.createEveType({ typeId: '34' }));
expectType<SolarSystem>(SdeTestDataFactory.createSolarSystem({ name: 'Jita' }));
expectType<NpcCorporation>(SdeTestDataFactory.createNpcCorporation());
expectType<Blueprint>(SdeTestDataFactory.createBlueprint());
expectType<SdeVersionInfo>(SdeTestDataFactory.createVersionInfo());
expectType<MemorySdeData>(SdeTestDataFactory.createHierarchicalTestData());
