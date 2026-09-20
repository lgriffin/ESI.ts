import type { IStaticDataProvider } from './IStaticDataProvider';
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

export interface MemorySdeData {
  types?: EveType[];
  groups?: EveGroup[];
  categories?: EveCategory[];
  regions?: Region[];
  constellations?: Constellation[];
  solarSystems?: SolarSystem[];
  stargates?: Stargate[];
  stars?: Star[];
  planets?: Planet[];
  moons?: Moon[];
  asteroidBelts?: AsteroidBelt[];
  factions?: Faction[];
  races?: Race[];
  bloodlines?: Bloodline[];
  ancestries?: Ancestry[];
  npcCorporations?: NpcCorporation[];
  npcStations?: NpcStation[];
  marketGroups?: MarketGroup[];
  metaGroups?: MetaGroup[];
  icons?: Icon[];
  graphics?: Graphic[];
  dogmaAttributes?: DogmaAttribute[];
  dogmaEffects?: DogmaEffect[];
  blueprints?: Blueprint[];
  planetSchematics?: PlanetSchematic[];
  agentTypes?: AgentType[];
  agentsInSpace?: AgentInSpace[];
  certificates?: Certificate[];
  characterAttributes?: CharacterAttribute[];
  cloneGrades?: CloneGrade[];
  corporationActivities?: CorporationActivity[];
  dogmaAttributeCategories?: DogmaAttributeCategory[];
  dogmaUnits?: DogmaUnit[];
  industryActivities?: IndustryActivity[];
  landmarks?: Landmark[];
  notificationTypes?: NotificationType[];
  npcCharacters?: NpcCharacter[];
  npcCorporationDivisions?: NpcCorporationDivision[];
  schools?: School[];
  secondarySuns?: SecondarySun[];
  skins?: Skin[];
  skinLicenses?: SkinLicense[];
  stationOperations?: StationOperation[];
  stationServices?: StationService[];
  typeDogma?: TypeDogma[];
  typeMaterials?: TypeMaterial[];
  typeBonuses?: TypeBonus[];
  missions?: Mission[];
  dungeons?: Dungeon[];
  epicArcs?: EpicArc[];
  version?: Partial<SdeVersionInfo>;
}

export class MemorySdeProvider implements IStaticDataProvider {
  private data: Map<string, Map<number | string, unknown>> = new Map();
  private versionInfo: SdeVersionInfo;

  constructor(data: MemorySdeData = {}) {
    const register = <T>(
      key: string,
      items: T[] | undefined,
      idFn: (item: T) => number | string,
    ): void => {
      this.data.set(
        key,
        new Map((items ?? []).map((item) => [idFn(item), item])),
      );
    };

    register('eve_types', data.types, (t) => t.typeId);
    register('eve_groups', data.groups, (g) => g.groupId);
    register('eve_categories', data.categories, (c) => c.categoryId);
    register('eve_regions', data.regions, (r) => r.regionId);
    register(
      'eve_constellations',
      data.constellations,
      (c) => c.constellationId,
    );
    register('eve_solar_systems', data.solarSystems, (s) => s.systemId);
    register('eve_stargates', data.stargates, (s) => s.stargateId);
    register('eve_stars', data.stars, (s) => s.starId);
    register('eve_planets', data.planets, (p) => p.planetId);
    register('eve_moons', data.moons, (m) => m.moonId);
    register('eve_asteroid_belts', data.asteroidBelts, (a) => a.asteroidBeltId);
    register('eve_factions', data.factions, (f) => f.factionId);
    register('eve_races', data.races, (r) => r.raceId);
    register('eve_bloodlines', data.bloodlines, (b) => b.bloodlineId);
    register('eve_ancestries', data.ancestries, (a) => a.ancestryId);
    register(
      'eve_npc_corporations',
      data.npcCorporations,
      (c) => c.corporationId,
    );
    register('eve_npc_stations', data.npcStations, (s) => s.stationId);
    register('eve_market_groups', data.marketGroups, (g) => g.marketGroupId);
    register('eve_meta_groups', data.metaGroups, (g) => g.metaGroupId);
    register('eve_icons', data.icons, (i) => i.iconId);
    register('eve_graphics', data.graphics, (g) => g.graphicId);
    register(
      'eve_dogma_attributes',
      data.dogmaAttributes,
      (a) => a.attributeId,
    );
    register('eve_dogma_effects', data.dogmaEffects, (e) => e.effectId);
    register('eve_blueprints', data.blueprints, (b) => b.blueprintTypeId);
    register(
      'eve_planet_schematics',
      data.planetSchematics,
      (s) => s.planetSchematicId,
    );
    register('eve_agent_types', data.agentTypes, (a) => a.agentTypeId);
    register('eve_agents_in_space', data.agentsInSpace, (a) => a.characterId);
    register('eve_certificates', data.certificates, (c) => c.certificateId);
    register(
      'eve_character_attributes',
      data.characterAttributes,
      (c) => c.attributeId,
    );
    register('eve_clone_grades', data.cloneGrades, (c) => c.cloneGradeId);
    register(
      'eve_corporation_activities',
      data.corporationActivities,
      (c) => c.corporationActivityId,
    );
    register(
      'eve_dogma_attribute_categories',
      data.dogmaAttributeCategories,
      (d) => d.attributeCategoryId,
    );
    register('eve_dogma_units', data.dogmaUnits, (d) => d.unitId);
    register(
      'eve_industry_activities',
      data.industryActivities,
      (i) => i.industryActivityId,
    );
    register('eve_landmarks', data.landmarks, (l) => l.landmarkId);
    register(
      'eve_notification_types',
      data.notificationTypes,
      (n) => n.notificationTypeId,
    );
    register('eve_npc_characters', data.npcCharacters, (n) => n.characterId);
    register(
      'eve_npc_corporation_divisions',
      data.npcCorporationDivisions,
      (n) => n.npcCorporationDivisionId,
    );
    register('eve_schools', data.schools, (s) => s.schoolId);
    register('eve_secondary_suns', data.secondarySuns, (s) => s.secondarySunId);
    register('eve_skins', data.skins, (s) => s.skinId);
    register('eve_skin_licenses', data.skinLicenses, (s) => s.licenseTypeId);
    register(
      'eve_station_operations',
      data.stationOperations,
      (s) => s.stationOperationId,
    );
    register(
      'eve_station_services',
      data.stationServices,
      (s) => s.stationServiceId,
    );
    register('eve_type_dogma', data.typeDogma, (t) => t.typeId);
    register('eve_type_materials', data.typeMaterials, (t) => t.typeId);
    register('eve_type_bonuses', data.typeBonuses, (t) => t.typeId);
    register('eve_missions', data.missions, (m) => m.missionId);
    register('eve_dungeons', data.dungeons, (d) => d.dungeonId);
    register('eve_epic_arcs', data.epicArcs, (e) => e.epicArcId);

    this.versionInfo = {
      version: data.version?.version ?? '1.0.0-test',
      buildDate: data.version?.buildDate ?? '2024-01-01T00:00:00Z',
      importedAt: data.version?.importedAt ?? '2024-01-01T00:00:00Z',
      checksum: data.version?.checksum,
    };
  }

  private getById<T>(table: string, id: number | string): T | null {
    return (this.data.get(table)?.get(id) as T) ?? null;
  }

  private getAllFrom<T>(table: string): T[] {
    const map = this.data.get(table);
    return map ? (Array.from(map.values()) as T[]) : [];
  }

  private filterBy<T>(table: string, field: string, value: unknown): T[] {
    return this.getAllFrom<T>(table).filter(
      (item) => (item as Record<string, unknown>)[field] === value,
    );
  }

  private searchBy<T>(
    table: string,
    field: string,
    query: string,
    limit = 25,
  ): T[] {
    const lowerQuery = query.toLowerCase();
    const results: T[] = [];
    for (const item of this.getAllFrom<T>(table)) {
      const val = (item as Record<string, unknown>)[field];
      if (typeof val === 'string' && val.toLowerCase().includes(lowerQuery)) {
        results.push(item);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // --- Types, Groups, Categories ---
  getType(typeId: number): EveType | null {
    return this.getById('eve_types', typeId);
  }
  getTypesByGroup(groupId: number): EveType[] {
    return this.filterBy('eve_types', 'groupId', groupId);
  }
  getGroup(groupId: number): EveGroup | null {
    return this.getById('eve_groups', groupId);
  }
  getGroupsByCategory(categoryId: number): EveGroup[] {
    return this.filterBy('eve_groups', 'categoryId', categoryId);
  }
  getCategory(categoryId: number): EveCategory | null {
    return this.getById('eve_categories', categoryId);
  }
  getAllCategories(): EveCategory[] {
    return this.getAllFrom('eve_categories');
  }

  // --- Regions, Constellations, Solar Systems, Stargates ---
  getRegion(regionId: number): Region | null {
    return this.getById('eve_regions', regionId);
  }
  getAllRegions(): Region[] {
    return this.getAllFrom('eve_regions');
  }
  getConstellation(constellationId: number): Constellation | null {
    return this.getById('eve_constellations', constellationId);
  }
  getConstellationsByRegion(regionId: number): Constellation[] {
    return this.filterBy('eve_constellations', 'regionId', regionId);
  }
  getSolarSystem(systemId: number): SolarSystem | null {
    return this.getById('eve_solar_systems', systemId);
  }
  getSolarSystemsByConstellation(constellationId: number): SolarSystem[] {
    return this.filterBy(
      'eve_solar_systems',
      'constellationId',
      constellationId,
    );
  }
  getStargate(stargateId: number): Stargate | null {
    return this.getById('eve_stargates', stargateId);
  }
  getStargatesBySystem(systemId: number): Stargate[] {
    return this.filterBy('eve_stargates', 'solarSystemId', systemId);
  }

  // --- Search ---
  searchTypesByName(query: string, limit = 25): EveType[] {
    return this.searchBy('eve_types', 'name', query, limit);
  }
  searchSolarSystemsByName(query: string, limit = 25): SolarSystem[] {
    return this.searchBy('eve_solar_systems', 'name', query, limit);
  }

  // --- Universe ---
  getStar(starId: number): Star | null {
    return this.getById('eve_stars', starId);
  }
  getStarBySystem(systemId: number): Star | null {
    return (
      this.filterBy<Star>('eve_stars', 'solarSystemId', systemId)[0] ?? null
    );
  }
  getPlanet(planetId: number): Planet | null {
    return this.getById('eve_planets', planetId);
  }
  getPlanetsBySystem(systemId: number): Planet[] {
    return this.filterBy('eve_planets', 'solarSystemId', systemId);
  }
  getMoon(moonId: number): Moon | null {
    return this.getById('eve_moons', moonId);
  }
  getMoonsBySystem(systemId: number): Moon[] {
    return this.filterBy('eve_moons', 'solarSystemId', systemId);
  }
  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null {
    return this.getById('eve_asteroid_belts', asteroidBeltId);
  }
  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[] {
    return this.filterBy('eve_asteroid_belts', 'solarSystemId', systemId);
  }

  // --- Character/Lore ---
  getFaction(factionId: number): Faction | null {
    return this.getById('eve_factions', factionId);
  }
  getAllFactions(): Faction[] {
    return this.getAllFrom('eve_factions');
  }
  getRace(raceId: number): Race | null {
    return this.getById('eve_races', raceId);
  }
  getAllRaces(): Race[] {
    return this.getAllFrom('eve_races');
  }
  getBloodline(bloodlineId: number): Bloodline | null {
    return this.getById('eve_bloodlines', bloodlineId);
  }
  getBloodlinesByRace(raceId: number): Bloodline[] {
    return this.filterBy('eve_bloodlines', 'raceId', raceId);
  }
  getAncestry(ancestryId: number): Ancestry | null {
    return this.getById('eve_ancestries', ancestryId);
  }
  getAncestriesByBloodline(bloodlineId: number): Ancestry[] {
    return this.filterBy('eve_ancestries', 'bloodlineId', bloodlineId);
  }

  // --- NPC Infrastructure ---
  getNpcCorporation(corporationId: number): NpcCorporation | null {
    return this.getById('eve_npc_corporations', corporationId);
  }
  getNpcCorporationsByFaction(factionId: number): NpcCorporation[] {
    return this.filterBy('eve_npc_corporations', 'factionId', factionId);
  }
  getNpcStation(stationId: number): NpcStation | null {
    return this.getById('eve_npc_stations', stationId);
  }
  getNpcStationsBySystem(systemId: number): NpcStation[] {
    return this.filterBy('eve_npc_stations', 'solarSystemId', systemId);
  }
  getNpcStationsByOwner(ownerId: number): NpcStation[] {
    return this.filterBy('eve_npc_stations', 'ownerId', ownerId);
  }

  // --- Market ---
  getMarketGroup(marketGroupId: number): MarketGroup | null {
    return this.getById('eve_market_groups', marketGroupId);
  }
  getMarketGroupsByParent(parentGroupId: number): MarketGroup[] {
    return this.filterBy('eve_market_groups', 'parentGroupId', parentGroupId);
  }
  getRootMarketGroups(): MarketGroup[] {
    return this.getAllFrom<MarketGroup>('eve_market_groups').filter(
      (g) => g.parentGroupId === null,
    );
  }
  getTypesByMarketGroup(marketGroupId: number): EveType[] {
    return this.filterBy('eve_types', 'marketGroupId', marketGroupId);
  }
  searchMarketGroupsByName(query: string, limit = 25): MarketGroup[] {
    return this.searchBy('eve_market_groups', 'name', query, limit);
  }

  // --- Meta/UI ---
  getMetaGroup(metaGroupId: number): MetaGroup | null {
    return this.getById('eve_meta_groups', metaGroupId);
  }
  getAllMetaGroups(): MetaGroup[] {
    return this.getAllFrom('eve_meta_groups');
  }
  getIcon(iconId: number): Icon | null {
    return this.getById('eve_icons', iconId);
  }
  getGraphic(graphicId: number): Graphic | null {
    return this.getById('eve_graphics', graphicId);
  }

  // --- Dogma ---
  getDogmaAttribute(attributeId: number): DogmaAttribute | null {
    return this.getById('eve_dogma_attributes', attributeId);
  }
  searchDogmaAttributesByName(query: string, limit = 25): DogmaAttribute[] {
    return this.searchBy('eve_dogma_attributes', 'name', query, limit);
  }
  getDogmaEffect(effectId: number): DogmaEffect | null {
    return this.getById('eve_dogma_effects', effectId);
  }
  searchDogmaEffectsByName(query: string, limit = 25): DogmaEffect[] {
    return this.searchBy('eve_dogma_effects', 'name', query, limit);
  }
  getDogmaAttributeCategory(
    attributeCategoryId: number,
  ): DogmaAttributeCategory | null {
    return this.getById('eve_dogma_attribute_categories', attributeCategoryId);
  }
  getAllDogmaAttributeCategories(): DogmaAttributeCategory[] {
    return this.getAllFrom('eve_dogma_attribute_categories');
  }
  getDogmaUnit(unitId: number): DogmaUnit | null {
    return this.getById('eve_dogma_units', unitId);
  }
  getAllDogmaUnits(): DogmaUnit[] {
    return this.getAllFrom('eve_dogma_units');
  }

  // --- Industry ---
  getBlueprint(blueprintTypeId: number): Blueprint | null {
    return this.getById('eve_blueprints', blueprintTypeId);
  }
  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null {
    return this.getById('eve_planet_schematics', planetSchematicId);
  }
  getAllPlanetSchematics(): PlanetSchematic[] {
    return this.getAllFrom('eve_planet_schematics');
  }
  getIndustryActivity(industryActivityId: number): IndustryActivity | null {
    return this.getById('eve_industry_activities', industryActivityId);
  }
  getAllIndustryActivities(): IndustryActivity[] {
    return this.getAllFrom('eve_industry_activities');
  }

  // --- Agent System ---
  getAgentType(agentTypeId: number): AgentType | null {
    return this.getById('eve_agent_types', agentTypeId);
  }
  getAllAgentTypes(): AgentType[] {
    return this.getAllFrom('eve_agent_types');
  }
  getAgentInSpace(characterId: number): AgentInSpace | null {
    return this.getById('eve_agents_in_space', characterId);
  }
  getAgentsInSpaceBySystem(systemId: number): AgentInSpace[] {
    return this.filterBy('eve_agents_in_space', 'solarSystemId', systemId);
  }

  // --- Certificates ---
  getCertificate(certificateId: number): Certificate | null {
    return this.getById('eve_certificates', certificateId);
  }
  getAllCertificates(): Certificate[] {
    return this.getAllFrom('eve_certificates');
  }

  // --- Character Attributes ---
  getCharacterAttribute(attributeId: number): CharacterAttribute | null {
    return this.getById('eve_character_attributes', attributeId);
  }
  getAllCharacterAttributes(): CharacterAttribute[] {
    return this.getAllFrom('eve_character_attributes');
  }

  // --- NPC Characters ---
  getNpcCharacter(characterId: number): NpcCharacter | null {
    return this.getById('eve_npc_characters', characterId);
  }
  getNpcCharactersByCorporation(corporationId: number): NpcCharacter[] {
    return this.filterBy('eve_npc_characters', 'corporationId', corporationId);
  }
  searchNpcCharactersByName(query: string, limit = 25): NpcCharacter[] {
    return this.searchBy('eve_npc_characters', 'name', query, limit);
  }

  // --- Clone Grades ---
  getCloneGrade(cloneGradeId: number): CloneGrade | null {
    return this.getById('eve_clone_grades', cloneGradeId);
  }
  getAllCloneGrades(): CloneGrade[] {
    return this.getAllFrom('eve_clone_grades');
  }

  // --- Corporation Reference ---
  getCorporationActivity(
    corporationActivityId: number,
  ): CorporationActivity | null {
    return this.getById('eve_corporation_activities', corporationActivityId);
  }
  getAllCorporationActivities(): CorporationActivity[] {
    return this.getAllFrom('eve_corporation_activities');
  }
  getNpcCorporationDivision(
    npcCorporationDivisionId: number,
  ): NpcCorporationDivision | null {
    return this.getById(
      'eve_npc_corporation_divisions',
      npcCorporationDivisionId,
    );
  }
  getAllNpcCorporationDivisions(): NpcCorporationDivision[] {
    return this.getAllFrom('eve_npc_corporation_divisions');
  }

  // --- Landmarks ---
  getLandmark(landmarkId: number): Landmark | null {
    return this.getById('eve_landmarks', landmarkId);
  }
  getAllLandmarks(): Landmark[] {
    return this.getAllFrom('eve_landmarks');
  }

  // --- Notifications ---
  getNotificationType(notificationTypeId: number): NotificationType | null {
    return this.getById('eve_notification_types', notificationTypeId);
  }

  // --- Schools ---
  getSchool(schoolId: number): School | null {
    return this.getById('eve_schools', schoolId);
  }
  getAllSchools(): School[] {
    return this.getAllFrom('eve_schools');
  }

  // --- Secondary Suns ---
  getSecondarySun(secondarySunId: number): SecondarySun | null {
    return this.getById('eve_secondary_suns', secondarySunId);
  }
  getSecondarySunsBySystem(systemId: number): SecondarySun[] {
    return this.filterBy('eve_secondary_suns', 'solarSystemId', systemId);
  }

  // --- Skins ---
  getSkin(skinId: number): Skin | null {
    return this.getById('eve_skins', skinId);
  }
  getSkinLicense(licenseTypeId: number): SkinLicense | null {
    return this.getById('eve_skin_licenses', licenseTypeId);
  }
  getSkinLicensesBySkin(skinId: number): SkinLicense[] {
    return this.filterBy('eve_skin_licenses', 'skinId', skinId);
  }

  // --- Station Operations & Services ---
  getStationOperation(stationOperationId: number): StationOperation | null {
    return this.getById('eve_station_operations', stationOperationId);
  }
  getAllStationOperations(): StationOperation[] {
    return this.getAllFrom('eve_station_operations');
  }
  getStationService(stationServiceId: number): StationService | null {
    return this.getById('eve_station_services', stationServiceId);
  }
  getAllStationServices(): StationService[] {
    return this.getAllFrom('eve_station_services');
  }

  // --- Type Extensions ---
  getTypeDogma(typeId: number): TypeDogma | null {
    return this.getById('eve_type_dogma', typeId);
  }
  getTypeMaterial(typeId: number): TypeMaterial | null {
    return this.getById('eve_type_materials', typeId);
  }
  getTypeBonus(typeId: number): TypeBonus | null {
    return this.getById('eve_type_bonuses', typeId);
  }

  // --- Missions & Content ---
  getMission(missionId: number): Mission | null {
    return this.getById('eve_missions', missionId);
  }
  getDungeon(dungeonId: number): Dungeon | null {
    return this.getById('eve_dungeons', dungeonId);
  }
  getEpicArc(epicArcId: number): EpicArc | null {
    return this.getById('eve_epic_arcs', epicArcId);
  }
  getAllEpicArcs(): EpicArc[] {
    return this.getAllFrom('eve_epic_arcs');
  }

  // --- Generic accessor ---
  getEntity<T = Record<string, unknown>>(
    tableName: string,
    id: number | string,
  ): T | null {
    return this.getById<T>(tableName, id);
  }

  getAllEntities<T = Record<string, unknown>>(tableName: string): T[] {
    return this.getAllFrom<T>(tableName);
  }

  // --- Version & Lifecycle ---
  getVersion(): SdeVersionInfo {
    return { ...this.versionInfo };
  }

  close(): void {
    this.data.clear();
  }
}
