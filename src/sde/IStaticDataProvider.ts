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

export interface IStaticDataProvider {
  getType(typeId: number): EveType | null;
  getTypesByGroup(groupId: number): EveType[];
  getGroup(groupId: number): EveGroup | null;
  getGroupsByCategory(categoryId: number): EveGroup[];
  getCategory(categoryId: number): EveCategory | null;
  getAllCategories(): EveCategory[];

  getRegion(regionId: number): Region | null;
  getAllRegions(): Region[];
  getConstellation(constellationId: number): Constellation | null;
  getConstellationsByRegion(regionId: number): Constellation[];
  getSolarSystem(systemId: number): SolarSystem | null;
  getSolarSystemsByConstellation(constellationId: number): SolarSystem[];
  getStargate(stargateId: number): Stargate | null;
  getStargatesBySystem(systemId: number): Stargate[];

  searchTypesByName(query: string, limit?: number): EveType[];
  searchSolarSystemsByName(query: string, limit?: number): SolarSystem[];

  // Universe
  getStar(starId: number): Star | null;
  getStarBySystem(systemId: number): Star | null;
  getPlanet(planetId: number): Planet | null;
  getPlanetsBySystem(systemId: number): Planet[];
  getMoon(moonId: number): Moon | null;
  getMoonsByPlanet(planetId: number): Moon[];
  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null;
  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[];

  // Character/Lore
  getFaction(factionId: number): Faction | null;
  getAllFactions(): Faction[];
  getRace(raceId: number): Race | null;
  getAllRaces(): Race[];
  getBloodline(bloodlineId: number): Bloodline | null;
  getBloodlinesByRace(raceId: number): Bloodline[];
  getAncestry(ancestryId: number): Ancestry | null;
  getAncestriesByBloodline(bloodlineId: number): Ancestry[];

  // NPC Infrastructure
  getNpcCorporation(corporationId: number): NpcCorporation | null;
  getNpcCorporationsByFaction(factionId: number): NpcCorporation[];
  getNpcStation(stationId: number): NpcStation | null;
  getNpcStationsBySystem(systemId: number): NpcStation[];
  getNpcStationsByCorporation(corporationId: number): NpcStation[];
  searchNpcStationsByName(query: string, limit?: number): NpcStation[];

  // Market
  getMarketGroup(marketGroupId: number): MarketGroup | null;
  getMarketGroupsByParent(parentGroupId: number): MarketGroup[];
  getRootMarketGroups(): MarketGroup[];
  getTypesByMarketGroup(marketGroupId: number): EveType[];
  searchMarketGroupsByName(query: string, limit?: number): MarketGroup[];

  // Meta/UI
  getMetaGroup(metaGroupId: number): MetaGroup | null;
  getAllMetaGroups(): MetaGroup[];
  getIcon(iconId: number): Icon | null;
  getGraphic(graphicId: number): Graphic | null;

  // Dogma
  getDogmaAttribute(attributeId: number): DogmaAttribute | null;
  searchDogmaAttributesByName(query: string, limit?: number): DogmaAttribute[];
  getDogmaEffect(effectId: number): DogmaEffect | null;
  searchDogmaEffectsByName(query: string, limit?: number): DogmaEffect[];

  // Industry
  getBlueprint(blueprintTypeId: number): Blueprint | null;
  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null;
  getAllPlanetSchematics(): PlanetSchematic[];

  getVersion(): SdeVersionInfo;

  close(): void;
}
