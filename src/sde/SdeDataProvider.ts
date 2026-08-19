import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
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
import { SDE_FILE_REGISTRY } from './ingestion/constants';
import type { SdeFileSpec } from './ingestion/constants';
import { SdeExtractor } from './ingestion/SdeExtractor';
import { transformRecordNative } from './ingestion/transforms';
import { SdeError } from './errors';

export class SdeDataProvider implements IStaticDataProvider {
  private entities = new Map<
    string,
    Map<number | string, Record<string, unknown>>
  >();
  private fkIndexes = new Map<
    string,
    Map<unknown, Record<string, unknown>[]>
  >();
  private versionInfo: SdeVersionInfo;

  private constructor(version: SdeVersionInfo) {
    this.versionInfo = version;
  }

  static fromDirectory(dirPath: string): SdeDataProvider {
    const resolvedDir = path.resolve(dirPath);
    if (!fs.existsSync(resolvedDir)) {
      throw new SdeError(`SDE directory not found: ${resolvedDir}`);
    }

    let version: SdeVersionInfo = {
      version: 'unknown',
      buildDate: 'unknown',
      importedAt: new Date().toISOString(),
    };

    const metaPath = path.join(resolvedDir, '_sde.yaml');
    if (fs.existsSync(metaPath)) {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const parsed = yaml.load(metaContent) as Record<string, unknown>;
      const sdeBlock = (parsed.sde ?? parsed) as Record<string, unknown>;
      const bn = sdeBlock.buildNumber;
      const rd = sdeBlock.releaseDate;
      version = {
        version:
          typeof bn === 'string' || typeof bn === 'number'
            ? String(bn)
            : 'unknown',
        buildDate:
          typeof rd === 'string' || typeof rd === 'number'
            ? String(rd)
            : 'unknown',
        importedAt: new Date().toISOString(),
      };
    }

    const provider = new SdeDataProvider(version);

    for (const spec of SDE_FILE_REGISTRY) {
      const filePath = path.join(resolvedDir, spec.yamlFile);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.load(content) as Record<
        string | number,
        Record<string, unknown>
      > | null;
      if (!parsed || typeof parsed !== 'object') continue;

      provider.loadRecords(spec, parsed);
    }

    return provider;
  }

  static fromZip(zipPath: string): SdeDataProvider {
    const resolvedPath = path.resolve(zipPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new SdeError(`SDE ZIP file not found: ${resolvedPath}`);
    }

    const extractor = new SdeExtractor();
    const metadata = extractor.readMetadata(resolvedPath);

    const version: SdeVersionInfo = {
      version: metadata.buildNumber || 'unknown',
      buildDate: metadata.releaseDate || 'unknown',
      importedAt: new Date().toISOString(),
    };

    const provider = new SdeDataProvider(version);

    const yamlFiles = SDE_FILE_REGISTRY.map((s) => s.yamlFile);
    const parsedFiles = extractor.parseFiles(resolvedPath, yamlFiles);
    const specMap = new Map(SDE_FILE_REGISTRY.map((s) => [s.yamlFile, s]));

    for (const file of parsedFiles) {
      const spec = specMap.get(file.filename);
      if (!spec) continue;

      const rawEntries: Record<string | number, Record<string, unknown>> = {};
      for (const [key, value] of file.records) {
        rawEntries[key] = value;
      }
      provider.loadRecords(spec, rawEntries);
    }

    return provider;
  }

  private loadRecords(
    spec: SdeFileSpec,
    raw: Record<string | number, Record<string, unknown>>,
  ): void {
    const records = new Map<number | string, Record<string, unknown>>();
    for (const [key, value] of Object.entries(raw)) {
      if (value == null || typeof value !== 'object') continue;
      const id = spec.idType === 'string' ? key : Number(key);
      const transformed = transformRecordNative(id, value, spec);
      records.set(id, transformed);
    }
    this.entities.set(spec.tableName, records);
  }

  // ---------------------------------------------------------------
  // Generic helpers
  // ---------------------------------------------------------------

  private getById<T>(tableName: string, id: number | string): T | null {
    const table = this.entities.get(tableName);
    if (!table) return null;
    const row = table.get(id);
    return (row as T) ?? null;
  }

  private getByFk<T>(
    tableName: string,
    fkField: string,
    fkValue: unknown,
  ): T[] {
    const indexKey = `${tableName}:${fkField}`;
    let index = this.fkIndexes.get(indexKey);
    if (!index) {
      index = new Map();
      const table = this.entities.get(tableName);
      if (table) {
        for (const row of table.values()) {
          const val = row[fkField];
          if (val == null) continue;
          const existing = index.get(val);
          if (existing) existing.push(row);
          else index.set(val, [row]);
        }
      }
      this.fkIndexes.set(indexKey, index);
    }
    return (index.get(fkValue) ?? []) as T[];
  }

  private getAllRecords<T>(tableName: string): T[] {
    const table = this.entities.get(tableName);
    if (!table) return [];
    return Array.from(table.values()) as T[];
  }

  private search<T>(
    tableName: string,
    field: string,
    query: string,
    limit: number,
  ): T[] {
    const table = this.entities.get(tableName);
    if (!table) return [];
    const lowerQuery = query.toLowerCase();
    const results: T[] = [];
    for (const row of table.values()) {
      const val = row[field];
      if (typeof val === 'string' && val.toLowerCase().includes(lowerQuery)) {
        results.push(row as T);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  private filterBy<T>(
    tableName: string,
    predicate: (row: Record<string, unknown>) => boolean,
  ): T[] {
    const table = this.entities.get(tableName);
    if (!table) return [];
    const results: T[] = [];
    for (const row of table.values()) {
      if (predicate(row)) results.push(row as T);
    }
    return results;
  }

  // ---------------------------------------------------------------
  // Generic entity accessors (for niche entities)
  // ---------------------------------------------------------------

  getEntity<T = Record<string, unknown>>(
    tableName: string,
    id: number | string,
  ): T | null {
    return this.getById<T>(tableName, id);
  }

  getAllEntities<T = Record<string, unknown>>(tableName: string): T[] {
    return this.getAllRecords<T>(tableName);
  }

  // ---------------------------------------------------------------
  // Types, Groups, Categories
  // ---------------------------------------------------------------

  getType(typeId: number): EveType | null {
    return this.getById<EveType>('eve_types', typeId);
  }

  getTypesByGroup(groupId: number): EveType[] {
    return this.getByFk<EveType>('eve_types', 'groupId', groupId);
  }

  getGroup(groupId: number): EveGroup | null {
    return this.getById<EveGroup>('eve_groups', groupId);
  }

  getGroupsByCategory(categoryId: number): EveGroup[] {
    return this.getByFk<EveGroup>('eve_groups', 'categoryId', categoryId);
  }

  getCategory(categoryId: number): EveCategory | null {
    return this.getById<EveCategory>('eve_categories', categoryId);
  }

  getAllCategories(): EveCategory[] {
    return this.getAllRecords<EveCategory>('eve_categories');
  }

  // ---------------------------------------------------------------
  // Regions, Constellations, Solar Systems, Stargates
  // ---------------------------------------------------------------

  getRegion(regionId: number): Region | null {
    return this.getById<Region>('eve_regions', regionId);
  }

  getAllRegions(): Region[] {
    return this.getAllRecords<Region>('eve_regions');
  }

  getConstellation(constellationId: number): Constellation | null {
    return this.getById<Constellation>('eve_constellations', constellationId);
  }

  getConstellationsByRegion(regionId: number): Constellation[] {
    return this.getByFk<Constellation>(
      'eve_constellations',
      'regionId',
      regionId,
    );
  }

  getSolarSystem(systemId: number): SolarSystem | null {
    return this.getById<SolarSystem>('eve_solar_systems', systemId);
  }

  getSolarSystemsByConstellation(constellationId: number): SolarSystem[] {
    return this.getByFk<SolarSystem>(
      'eve_solar_systems',
      'constellationId',
      constellationId,
    );
  }

  getStargate(stargateId: number): Stargate | null {
    return this.getById<Stargate>('eve_stargates', stargateId);
  }

  getStargatesBySystem(systemId: number): Stargate[] {
    return this.getByFk<Stargate>('eve_stargates', 'solarSystemId', systemId);
  }

  // ---------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------

  searchTypesByName(query: string, limit = 25): EveType[] {
    return this.search<EveType>('eve_types', 'name', query, limit);
  }

  searchSolarSystemsByName(query: string, limit = 25): SolarSystem[] {
    return this.search<SolarSystem>('eve_solar_systems', 'name', query, limit);
  }

  // ---------------------------------------------------------------
  // Universe
  // ---------------------------------------------------------------

  getStar(starId: number): Star | null {
    return this.getById<Star>('eve_stars', starId);
  }

  getStarBySystem(systemId: number): Star | null {
    const stars = this.getByFk<Star>('eve_stars', 'solarSystemId', systemId);
    return stars[0] ?? null;
  }

  getPlanet(planetId: number): Planet | null {
    return this.getById<Planet>('eve_planets', planetId);
  }

  getPlanetsBySystem(systemId: number): Planet[] {
    return this.getByFk<Planet>('eve_planets', 'solarSystemId', systemId);
  }

  getMoon(moonId: number): Moon | null {
    return this.getById<Moon>('eve_moons', moonId);
  }

  getMoonsBySystem(systemId: number): Moon[] {
    return this.getByFk<Moon>('eve_moons', 'solarSystemId', systemId);
  }

  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null {
    return this.getById<AsteroidBelt>('eve_asteroid_belts', asteroidBeltId);
  }

  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[] {
    return this.getByFk<AsteroidBelt>(
      'eve_asteroid_belts',
      'solarSystemId',
      systemId,
    );
  }

  // ---------------------------------------------------------------
  // Character/Lore
  // ---------------------------------------------------------------

  getFaction(factionId: number): Faction | null {
    return this.getById<Faction>('eve_factions', factionId);
  }

  getAllFactions(): Faction[] {
    return this.getAllRecords<Faction>('eve_factions');
  }

  getRace(raceId: number): Race | null {
    return this.getById<Race>('eve_races', raceId);
  }

  getAllRaces(): Race[] {
    return this.getAllRecords<Race>('eve_races');
  }

  getBloodline(bloodlineId: number): Bloodline | null {
    return this.getById<Bloodline>('eve_bloodlines', bloodlineId);
  }

  getBloodlinesByRace(raceId: number): Bloodline[] {
    return this.getByFk<Bloodline>('eve_bloodlines', 'raceId', raceId);
  }

  getAncestry(ancestryId: number): Ancestry | null {
    return this.getById<Ancestry>('eve_ancestries', ancestryId);
  }

  getAncestriesByBloodline(bloodlineId: number): Ancestry[] {
    return this.getByFk<Ancestry>('eve_ancestries', 'bloodlineId', bloodlineId);
  }

  // ---------------------------------------------------------------
  // NPC Infrastructure
  // ---------------------------------------------------------------

  getNpcCorporation(corporationId: number): NpcCorporation | null {
    return this.getById<NpcCorporation>('eve_npc_corporations', corporationId);
  }

  getNpcCorporationsByFaction(factionId: number): NpcCorporation[] {
    return this.getByFk<NpcCorporation>(
      'eve_npc_corporations',
      'factionId',
      factionId,
    );
  }

  getNpcStation(stationId: number): NpcStation | null {
    return this.getById<NpcStation>('eve_npc_stations', stationId);
  }

  getNpcStationsBySystem(systemId: number): NpcStation[] {
    return this.getByFk<NpcStation>(
      'eve_npc_stations',
      'solarSystemId',
      systemId,
    );
  }

  getNpcStationsByOwner(ownerId: number): NpcStation[] {
    return this.getByFk<NpcStation>('eve_npc_stations', 'ownerId', ownerId);
  }

  // ---------------------------------------------------------------
  // Market
  // ---------------------------------------------------------------

  getMarketGroup(marketGroupId: number): MarketGroup | null {
    return this.getById<MarketGroup>('eve_market_groups', marketGroupId);
  }

  getMarketGroupsByParent(parentGroupId: number): MarketGroup[] {
    return this.getByFk<MarketGroup>(
      'eve_market_groups',
      'parentGroupId',
      parentGroupId,
    );
  }

  getRootMarketGroups(): MarketGroup[] {
    return this.filterBy<MarketGroup>(
      'eve_market_groups',
      (r) => r.parentGroupId == null,
    );
  }

  getTypesByMarketGroup(marketGroupId: number): EveType[] {
    return this.getByFk<EveType>('eve_types', 'marketGroupId', marketGroupId);
  }

  searchMarketGroupsByName(query: string, limit = 25): MarketGroup[] {
    return this.search<MarketGroup>('eve_market_groups', 'name', query, limit);
  }

  // ---------------------------------------------------------------
  // Meta/UI
  // ---------------------------------------------------------------

  getMetaGroup(metaGroupId: number): MetaGroup | null {
    return this.getById<MetaGroup>('eve_meta_groups', metaGroupId);
  }

  getAllMetaGroups(): MetaGroup[] {
    return this.getAllRecords<MetaGroup>('eve_meta_groups');
  }

  getIcon(iconId: number): Icon | null {
    return this.getById<Icon>('eve_icons', iconId);
  }

  getGraphic(graphicId: number): Graphic | null {
    return this.getById<Graphic>('eve_graphics', graphicId);
  }

  // ---------------------------------------------------------------
  // Dogma
  // ---------------------------------------------------------------

  getDogmaAttribute(attributeId: number): DogmaAttribute | null {
    return this.getById<DogmaAttribute>('eve_dogma_attributes', attributeId);
  }

  searchDogmaAttributesByName(query: string, limit = 25): DogmaAttribute[] {
    return this.search<DogmaAttribute>(
      'eve_dogma_attributes',
      'name',
      query,
      limit,
    );
  }

  getDogmaEffect(effectId: number): DogmaEffect | null {
    return this.getById<DogmaEffect>('eve_dogma_effects', effectId);
  }

  searchDogmaEffectsByName(query: string, limit = 25): DogmaEffect[] {
    return this.search<DogmaEffect>('eve_dogma_effects', 'name', query, limit);
  }

  // ---------------------------------------------------------------
  // Industry
  // ---------------------------------------------------------------

  getBlueprint(blueprintTypeId: number): Blueprint | null {
    return this.getById<Blueprint>('eve_blueprints', blueprintTypeId);
  }

  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null {
    return this.getById<PlanetSchematic>(
      'eve_planet_schematics',
      planetSchematicId,
    );
  }

  getAllPlanetSchematics(): PlanetSchematic[] {
    return this.getAllRecords<PlanetSchematic>('eve_planet_schematics');
  }

  // ---------------------------------------------------------------
  // Agent System
  // ---------------------------------------------------------------

  getAgentType(agentTypeId: number): AgentType | null {
    return this.getById<AgentType>('eve_agent_types', agentTypeId);
  }

  getAllAgentTypes(): AgentType[] {
    return this.getAllRecords<AgentType>('eve_agent_types');
  }

  getAgentInSpace(characterId: number): AgentInSpace | null {
    return this.getById<AgentInSpace>('eve_agents_in_space', characterId);
  }

  getAgentsInSpaceBySystem(systemId: number): AgentInSpace[] {
    return this.getByFk<AgentInSpace>(
      'eve_agents_in_space',
      'solarSystemId',
      systemId,
    );
  }

  // ---------------------------------------------------------------
  // Certificates
  // ---------------------------------------------------------------

  getCertificate(certificateId: number): Certificate | null {
    return this.getById<Certificate>('eve_certificates', certificateId);
  }

  getAllCertificates(): Certificate[] {
    return this.getAllRecords<Certificate>('eve_certificates');
  }

  // ---------------------------------------------------------------
  // Character Attributes
  // ---------------------------------------------------------------

  getCharacterAttribute(attributeId: number): CharacterAttribute | null {
    return this.getById<CharacterAttribute>(
      'eve_character_attributes',
      attributeId,
    );
  }

  getAllCharacterAttributes(): CharacterAttribute[] {
    return this.getAllRecords<CharacterAttribute>('eve_character_attributes');
  }

  // ---------------------------------------------------------------
  // NPC Characters
  // ---------------------------------------------------------------

  getNpcCharacter(characterId: number): NpcCharacter | null {
    return this.getById<NpcCharacter>('eve_npc_characters', characterId);
  }

  getNpcCharactersByCorporation(corporationId: number): NpcCharacter[] {
    return this.getByFk<NpcCharacter>(
      'eve_npc_characters',
      'corporationId',
      corporationId,
    );
  }

  searchNpcCharactersByName(query: string, limit = 25): NpcCharacter[] {
    return this.search<NpcCharacter>(
      'eve_npc_characters',
      'name',
      query,
      limit,
    );
  }

  // ---------------------------------------------------------------
  // Clone Grades
  // ---------------------------------------------------------------

  getCloneGrade(cloneGradeId: number): CloneGrade | null {
    return this.getById<CloneGrade>('eve_clone_grades', cloneGradeId);
  }

  getAllCloneGrades(): CloneGrade[] {
    return this.getAllRecords<CloneGrade>('eve_clone_grades');
  }

  // ---------------------------------------------------------------
  // Corporation Reference
  // ---------------------------------------------------------------

  getCorporationActivity(
    corporationActivityId: number,
  ): CorporationActivity | null {
    return this.getById<CorporationActivity>(
      'eve_corporation_activities',
      corporationActivityId,
    );
  }

  getAllCorporationActivities(): CorporationActivity[] {
    return this.getAllRecords<CorporationActivity>(
      'eve_corporation_activities',
    );
  }

  getNpcCorporationDivision(
    npcCorporationDivisionId: number,
  ): NpcCorporationDivision | null {
    return this.getById<NpcCorporationDivision>(
      'eve_npc_corporation_divisions',
      npcCorporationDivisionId,
    );
  }

  getAllNpcCorporationDivisions(): NpcCorporationDivision[] {
    return this.getAllRecords<NpcCorporationDivision>(
      'eve_npc_corporation_divisions',
    );
  }

  // ---------------------------------------------------------------
  // Dogma Reference
  // ---------------------------------------------------------------

  getDogmaAttributeCategory(
    attributeCategoryId: number,
  ): DogmaAttributeCategory | null {
    return this.getById<DogmaAttributeCategory>(
      'eve_dogma_attribute_categories',
      attributeCategoryId,
    );
  }

  getAllDogmaAttributeCategories(): DogmaAttributeCategory[] {
    return this.getAllRecords<DogmaAttributeCategory>(
      'eve_dogma_attribute_categories',
    );
  }

  getDogmaUnit(unitId: number): DogmaUnit | null {
    return this.getById<DogmaUnit>('eve_dogma_units', unitId);
  }

  getAllDogmaUnits(): DogmaUnit[] {
    return this.getAllRecords<DogmaUnit>('eve_dogma_units');
  }

  // ---------------------------------------------------------------
  // Industry Reference
  // ---------------------------------------------------------------

  getIndustryActivity(industryActivityId: number): IndustryActivity | null {
    return this.getById<IndustryActivity>(
      'eve_industry_activities',
      industryActivityId,
    );
  }

  getAllIndustryActivities(): IndustryActivity[] {
    return this.getAllRecords<IndustryActivity>('eve_industry_activities');
  }

  // ---------------------------------------------------------------
  // Landmarks
  // ---------------------------------------------------------------

  getLandmark(landmarkId: number): Landmark | null {
    return this.getById<Landmark>('eve_landmarks', landmarkId);
  }

  getAllLandmarks(): Landmark[] {
    return this.getAllRecords<Landmark>('eve_landmarks');
  }

  // ---------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------

  getNotificationType(notificationTypeId: number): NotificationType | null {
    return this.getById<NotificationType>(
      'eve_notification_types',
      notificationTypeId,
    );
  }

  // ---------------------------------------------------------------
  // Schools
  // ---------------------------------------------------------------

  getSchool(schoolId: number): School | null {
    return this.getById<School>('eve_schools', schoolId);
  }

  getAllSchools(): School[] {
    return this.getAllRecords<School>('eve_schools');
  }

  // ---------------------------------------------------------------
  // Secondary Suns
  // ---------------------------------------------------------------

  getSecondarySun(secondarySunId: number): SecondarySun | null {
    return this.getById<SecondarySun>('eve_secondary_suns', secondarySunId);
  }

  getSecondarySunsBySystem(systemId: number): SecondarySun[] {
    return this.getByFk<SecondarySun>(
      'eve_secondary_suns',
      'solarSystemId',
      systemId,
    );
  }

  // ---------------------------------------------------------------
  // Skins
  // ---------------------------------------------------------------

  getSkin(skinId: number): Skin | null {
    return this.getById<Skin>('eve_skins', skinId);
  }

  getSkinLicense(licenseTypeId: number): SkinLicense | null {
    return this.getById<SkinLicense>('eve_skin_licenses', licenseTypeId);
  }

  getSkinLicensesBySkin(skinId: number): SkinLicense[] {
    return this.getByFk<SkinLicense>('eve_skin_licenses', 'skinId', skinId);
  }

  // ---------------------------------------------------------------
  // Station Operations & Services
  // ---------------------------------------------------------------

  getStationOperation(stationOperationId: number): StationOperation | null {
    return this.getById<StationOperation>(
      'eve_station_operations',
      stationOperationId,
    );
  }

  getAllStationOperations(): StationOperation[] {
    return this.getAllRecords<StationOperation>('eve_station_operations');
  }

  getStationService(stationServiceId: number): StationService | null {
    return this.getById<StationService>(
      'eve_station_services',
      stationServiceId,
    );
  }

  getAllStationServices(): StationService[] {
    return this.getAllRecords<StationService>('eve_station_services');
  }

  // ---------------------------------------------------------------
  // Type Properties
  // ---------------------------------------------------------------

  getTypeDogma(typeId: number): TypeDogma | null {
    return this.getById<TypeDogma>('eve_type_dogma', typeId);
  }

  getTypeMaterial(typeId: number): TypeMaterial | null {
    return this.getById<TypeMaterial>('eve_type_materials', typeId);
  }

  getTypeBonus(typeId: number): TypeBonus | null {
    return this.getById<TypeBonus>('eve_type_bonuses', typeId);
  }

  // ---------------------------------------------------------------
  // Missions & Content
  // ---------------------------------------------------------------

  getMission(missionId: number): Mission | null {
    return this.getById<Mission>('eve_missions', missionId);
  }

  getDungeon(dungeonId: number): Dungeon | null {
    return this.getById<Dungeon>('eve_dungeons', dungeonId);
  }

  getEpicArc(epicArcId: number): EpicArc | null {
    return this.getById<EpicArc>('eve_epic_arcs', epicArcId);
  }

  getAllEpicArcs(): EpicArc[] {
    return this.getAllRecords<EpicArc>('eve_epic_arcs');
  }

  // ---------------------------------------------------------------
  // Version & Lifecycle
  // ---------------------------------------------------------------

  getVersion(): SdeVersionInfo {
    return { ...this.versionInfo };
  }

  close(): void {
    this.entities.clear();
    this.fkIndexes.clear();
  }
}
