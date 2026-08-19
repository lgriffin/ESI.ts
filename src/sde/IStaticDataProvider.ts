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
  AgentType,
  AgentInSpace,
  Certificate,
  CharacterAttribute,
  CloneGrade,
  CorporationActivity,
  DogmaAttributeCategory,
  DogmaUnit,
  IndustryActivity,
  Landmark,
  NotificationType,
  NpcCharacter,
  NpcCorporationDivision,
  School,
  SecondarySun,
  Skin,
  SkinLicense,
  StationOperation,
  StationService,
  TypeDogma,
  TypeMaterial,
  TypeBonus,
  Mission,
  Dungeon,
  EpicArc,
} from './types';
import type { SdeVersionInfo } from './version';

export interface IStaticDataProvider {
  // --- Types, Groups, Categories ---
  getType(typeId: number): EveType | null;
  getTypesByGroup(groupId: number): EveType[];
  getGroup(groupId: number): EveGroup | null;
  getGroupsByCategory(categoryId: number): EveGroup[];
  getCategory(categoryId: number): EveCategory | null;
  getAllCategories(): EveCategory[];

  // --- Regions, Constellations, Solar Systems, Stargates ---
  getRegion(regionId: number): Region | null;
  getAllRegions(): Region[];
  getConstellation(constellationId: number): Constellation | null;
  getConstellationsByRegion(regionId: number): Constellation[];
  getSolarSystem(systemId: number): SolarSystem | null;
  getSolarSystemsByConstellation(constellationId: number): SolarSystem[];
  getStargate(stargateId: number): Stargate | null;
  getStargatesBySystem(systemId: number): Stargate[];

  // --- Search ---
  searchTypesByName(query: string, limit?: number): EveType[];
  searchSolarSystemsByName(query: string, limit?: number): SolarSystem[];

  // --- Universe ---
  getStar(starId: number): Star | null;
  getStarBySystem(systemId: number): Star | null;
  getPlanet(planetId: number): Planet | null;
  getPlanetsBySystem(systemId: number): Planet[];
  getMoon(moonId: number): Moon | null;
  getMoonsBySystem(systemId: number): Moon[];
  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null;
  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[];

  // --- Character/Lore ---
  getFaction(factionId: number): Faction | null;
  getAllFactions(): Faction[];
  getRace(raceId: number): Race | null;
  getAllRaces(): Race[];
  getBloodline(bloodlineId: number): Bloodline | null;
  getBloodlinesByRace(raceId: number): Bloodline[];
  getAncestry(ancestryId: number): Ancestry | null;
  getAncestriesByBloodline(bloodlineId: number): Ancestry[];

  // --- NPC Infrastructure ---
  getNpcCorporation(corporationId: number): NpcCorporation | null;
  getNpcCorporationsByFaction(factionId: number): NpcCorporation[];
  getNpcStation(stationId: number): NpcStation | null;
  getNpcStationsBySystem(systemId: number): NpcStation[];
  getNpcStationsByOwner(ownerId: number): NpcStation[];

  // --- Market ---
  getMarketGroup(marketGroupId: number): MarketGroup | null;
  getMarketGroupsByParent(parentGroupId: number): MarketGroup[];
  getRootMarketGroups(): MarketGroup[];
  getTypesByMarketGroup(marketGroupId: number): EveType[];
  searchMarketGroupsByName(query: string, limit?: number): MarketGroup[];

  // --- Meta/UI ---
  getMetaGroup(metaGroupId: number): MetaGroup | null;
  getAllMetaGroups(): MetaGroup[];
  getIcon(iconId: number): Icon | null;
  getGraphic(graphicId: number): Graphic | null;

  // --- Dogma ---
  getDogmaAttribute(attributeId: number): DogmaAttribute | null;
  searchDogmaAttributesByName(query: string, limit?: number): DogmaAttribute[];
  getDogmaEffect(effectId: number): DogmaEffect | null;
  searchDogmaEffectsByName(query: string, limit?: number): DogmaEffect[];
  getDogmaAttributeCategory(
    attributeCategoryId: number,
  ): DogmaAttributeCategory | null;
  getAllDogmaAttributeCategories(): DogmaAttributeCategory[];
  getDogmaUnit(unitId: number): DogmaUnit | null;
  getAllDogmaUnits(): DogmaUnit[];

  // --- Industry ---
  getBlueprint(blueprintTypeId: number): Blueprint | null;
  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null;
  getAllPlanetSchematics(): PlanetSchematic[];
  getIndustryActivity(industryActivityId: number): IndustryActivity | null;
  getAllIndustryActivities(): IndustryActivity[];

  // --- Agent System ---
  getAgentType(agentTypeId: number): AgentType | null;
  getAllAgentTypes(): AgentType[];
  getAgentInSpace(characterId: number): AgentInSpace | null;
  getAgentsInSpaceBySystem(systemId: number): AgentInSpace[];

  // --- Certificates ---
  getCertificate(certificateId: number): Certificate | null;
  getAllCertificates(): Certificate[];

  // --- Character ---
  getCharacterAttribute(attributeId: number): CharacterAttribute | null;
  getAllCharacterAttributes(): CharacterAttribute[];

  // --- NPC Characters ---
  getNpcCharacter(characterId: number): NpcCharacter | null;
  getNpcCharactersByCorporation(corporationId: number): NpcCharacter[];
  searchNpcCharactersByName(query: string, limit?: number): NpcCharacter[];

  // --- Clone Grades ---
  getCloneGrade(cloneGradeId: number): CloneGrade | null;
  getAllCloneGrades(): CloneGrade[];

  // --- Corporation Reference ---
  getCorporationActivity(
    corporationActivityId: number,
  ): CorporationActivity | null;
  getAllCorporationActivities(): CorporationActivity[];
  getNpcCorporationDivision(
    npcCorporationDivisionId: number,
  ): NpcCorporationDivision | null;
  getAllNpcCorporationDivisions(): NpcCorporationDivision[];

  // --- Landmarks ---
  getLandmark(landmarkId: number): Landmark | null;
  getAllLandmarks(): Landmark[];

  // --- Notifications ---
  getNotificationType(notificationTypeId: number): NotificationType | null;

  // --- Schools ---
  getSchool(schoolId: number): School | null;
  getAllSchools(): School[];

  // --- Secondary Suns ---
  getSecondarySun(secondarySunId: number): SecondarySun | null;
  getSecondarySunsBySystem(systemId: number): SecondarySun[];

  // --- Skins ---
  getSkin(skinId: number): Skin | null;
  getSkinLicense(licenseTypeId: number): SkinLicense | null;
  getSkinLicensesBySkin(skinId: number): SkinLicense[];

  // --- Station Operations & Services ---
  getStationOperation(stationOperationId: number): StationOperation | null;
  getAllStationOperations(): StationOperation[];
  getStationService(stationServiceId: number): StationService | null;
  getAllStationServices(): StationService[];

  // --- Type Extensions ---
  getTypeDogma(typeId: number): TypeDogma | null;
  getTypeMaterial(typeId: number): TypeMaterial | null;
  getTypeBonus(typeId: number): TypeBonus | null;

  // --- Missions & Content ---
  getMission(missionId: number): Mission | null;
  getDungeon(dungeonId: number): Dungeon | null;
  getEpicArc(epicArcId: number): EpicArc | null;
  getAllEpicArcs(): EpicArc[];

  // --- Generic accessor for any entity ---
  getEntity<T = Record<string, unknown>>(
    tableName: string,
    id: number | string,
  ): T | null;
  getAllEntities<T = Record<string, unknown>>(tableName: string): T[];

  // --- Version & Lifecycle ---
  getVersion(): SdeVersionInfo;
  close(): void;
}
