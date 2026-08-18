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
  version?: Partial<SdeVersionInfo>;
}

export class MemorySdeProvider implements IStaticDataProvider {
  private types: Map<number, EveType>;
  private groups: Map<number, EveGroup>;
  private categories: Map<number, EveCategory>;
  private regions: Map<number, Region>;
  private constellations: Map<number, Constellation>;
  private solarSystems: Map<number, SolarSystem>;
  private stargates: Map<number, Stargate>;
  private stars: Map<number, Star>;
  private planets: Map<number, Planet>;
  private moons: Map<number, Moon>;
  private asteroidBelts: Map<number, AsteroidBelt>;
  private factions: Map<number, Faction>;
  private racesMap: Map<number, Race>;
  private bloodlines: Map<number, Bloodline>;
  private ancestries: Map<number, Ancestry>;
  private npcCorporations: Map<number, NpcCorporation>;
  private npcStations: Map<number, NpcStation>;
  private marketGroups: Map<number, MarketGroup>;
  private metaGroups: Map<number, MetaGroup>;
  private icons: Map<number, Icon>;
  private graphics: Map<number, Graphic>;
  private dogmaAttributes: Map<number, DogmaAttribute>;
  private dogmaEffects: Map<number, DogmaEffect>;
  private blueprints: Map<number, Blueprint>;
  private planetSchematics: Map<number, PlanetSchematic>;
  private versionInfo: SdeVersionInfo;

  constructor(data: MemorySdeData = {}) {
    this.types = new Map((data.types ?? []).map((t) => [t.typeId, t]));
    this.groups = new Map((data.groups ?? []).map((g) => [g.groupId, g]));
    this.categories = new Map(
      (data.categories ?? []).map((c) => [c.categoryId, c]),
    );
    this.regions = new Map((data.regions ?? []).map((r) => [r.regionId, r]));
    this.constellations = new Map(
      (data.constellations ?? []).map((c) => [c.constellationId, c]),
    );
    this.solarSystems = new Map(
      (data.solarSystems ?? []).map((s) => [s.systemId, s]),
    );
    this.stargates = new Map(
      (data.stargates ?? []).map((s) => [s.stargateId, s]),
    );
    this.stars = new Map((data.stars ?? []).map((s) => [s.starId, s]));
    this.planets = new Map((data.planets ?? []).map((p) => [p.planetId, p]));
    this.moons = new Map((data.moons ?? []).map((m) => [m.moonId, m]));
    this.asteroidBelts = new Map(
      (data.asteroidBelts ?? []).map((a) => [a.asteroidBeltId, a]),
    );
    this.factions = new Map((data.factions ?? []).map((f) => [f.factionId, f]));
    this.racesMap = new Map((data.races ?? []).map((r) => [r.raceId, r]));
    this.bloodlines = new Map(
      (data.bloodlines ?? []).map((b) => [b.bloodlineId, b]),
    );
    this.ancestries = new Map(
      (data.ancestries ?? []).map((a) => [a.ancestryId, a]),
    );
    this.npcCorporations = new Map(
      (data.npcCorporations ?? []).map((c) => [c.corporationId, c]),
    );
    this.npcStations = new Map(
      (data.npcStations ?? []).map((s) => [s.stationId, s]),
    );
    this.marketGroups = new Map(
      (data.marketGroups ?? []).map((g) => [g.marketGroupId, g]),
    );
    this.metaGroups = new Map(
      (data.metaGroups ?? []).map((g) => [g.metaGroupId, g]),
    );
    this.icons = new Map((data.icons ?? []).map((i) => [i.iconId, i]));
    this.graphics = new Map((data.graphics ?? []).map((g) => [g.graphicId, g]));
    this.dogmaAttributes = new Map(
      (data.dogmaAttributes ?? []).map((a) => [a.attributeId, a]),
    );
    this.dogmaEffects = new Map(
      (data.dogmaEffects ?? []).map((e) => [e.effectId, e]),
    );
    this.blueprints = new Map(
      (data.blueprints ?? []).map((b) => [b.blueprintTypeId, b]),
    );
    this.planetSchematics = new Map(
      (data.planetSchematics ?? []).map((s) => [s.planetSchematicId, s]),
    );
    this.versionInfo = {
      version: data.version?.version ?? '1.0.0-test',
      buildDate: data.version?.buildDate ?? '2024-01-01T00:00:00Z',
      importedAt: data.version?.importedAt ?? '2024-01-01T00:00:00Z',
      checksum: data.version?.checksum,
    };
  }

  getType(typeId: number): EveType | null {
    return this.types.get(typeId) ?? null;
  }

  getTypesByGroup(groupId: number): EveType[] {
    return Array.from(this.types.values()).filter((t) => t.groupId === groupId);
  }

  getGroup(groupId: number): EveGroup | null {
    return this.groups.get(groupId) ?? null;
  }

  getGroupsByCategory(categoryId: number): EveGroup[] {
    return Array.from(this.groups.values()).filter(
      (g) => g.categoryId === categoryId,
    );
  }

  getCategory(categoryId: number): EveCategory | null {
    return this.categories.get(categoryId) ?? null;
  }

  getAllCategories(): EveCategory[] {
    return Array.from(this.categories.values());
  }

  getRegion(regionId: number): Region | null {
    return this.regions.get(regionId) ?? null;
  }

  getAllRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  getConstellation(constellationId: number): Constellation | null {
    return this.constellations.get(constellationId) ?? null;
  }

  getConstellationsByRegion(regionId: number): Constellation[] {
    return Array.from(this.constellations.values()).filter(
      (c) => c.regionId === regionId,
    );
  }

  getSolarSystem(systemId: number): SolarSystem | null {
    return this.solarSystems.get(systemId) ?? null;
  }

  getSolarSystemsByConstellation(constellationId: number): SolarSystem[] {
    return Array.from(this.solarSystems.values()).filter(
      (s) => s.constellationId === constellationId,
    );
  }

  getStargate(stargateId: number): Stargate | null {
    return this.stargates.get(stargateId) ?? null;
  }

  getStargatesBySystem(systemId: number): Stargate[] {
    return Array.from(this.stargates.values()).filter(
      (s) => s.systemId === systemId,
    );
  }

  searchTypesByName(query: string, limit = 25): EveType[] {
    const lowerQuery = query.toLowerCase();
    const results: EveType[] = [];
    for (const type of this.types.values()) {
      if (type.name.toLowerCase().includes(lowerQuery)) {
        results.push(type);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  searchSolarSystemsByName(query: string, limit = 25): SolarSystem[] {
    const lowerQuery = query.toLowerCase();
    const results: SolarSystem[] = [];
    for (const system of this.solarSystems.values()) {
      if (system.name.toLowerCase().includes(lowerQuery)) {
        results.push(system);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // Universe
  getStar(starId: number): Star | null {
    return this.stars.get(starId) ?? null;
  }

  getStarBySystem(systemId: number): Star | null {
    for (const star of this.stars.values()) {
      if (star.solarSystemId === systemId) return star;
    }
    return null;
  }

  getPlanet(planetId: number): Planet | null {
    return this.planets.get(planetId) ?? null;
  }

  getPlanetsBySystem(systemId: number): Planet[] {
    return Array.from(this.planets.values()).filter(
      (p) => p.solarSystemId === systemId,
    );
  }

  getMoon(moonId: number): Moon | null {
    return this.moons.get(moonId) ?? null;
  }

  getMoonsByPlanet(planetId: number): Moon[] {
    return Array.from(this.moons.values()).filter(
      (m) => m.planetId === planetId,
    );
  }

  getAsteroidBelt(asteroidBeltId: number): AsteroidBelt | null {
    return this.asteroidBelts.get(asteroidBeltId) ?? null;
  }

  getAsteroidBeltsBySystem(systemId: number): AsteroidBelt[] {
    return Array.from(this.asteroidBelts.values()).filter(
      (a) => a.solarSystemId === systemId,
    );
  }

  // Character/Lore
  getFaction(factionId: number): Faction | null {
    return this.factions.get(factionId) ?? null;
  }

  getAllFactions(): Faction[] {
    return Array.from(this.factions.values());
  }

  getRace(raceId: number): Race | null {
    return this.racesMap.get(raceId) ?? null;
  }

  getAllRaces(): Race[] {
    return Array.from(this.racesMap.values());
  }

  getBloodline(bloodlineId: number): Bloodline | null {
    return this.bloodlines.get(bloodlineId) ?? null;
  }

  getBloodlinesByRace(raceId: number): Bloodline[] {
    return Array.from(this.bloodlines.values()).filter(
      (b) => b.raceId === raceId,
    );
  }

  getAncestry(ancestryId: number): Ancestry | null {
    return this.ancestries.get(ancestryId) ?? null;
  }

  getAncestriesByBloodline(bloodlineId: number): Ancestry[] {
    return Array.from(this.ancestries.values()).filter(
      (a) => a.bloodlineId === bloodlineId,
    );
  }

  // NPC Infrastructure
  getNpcCorporation(corporationId: number): NpcCorporation | null {
    return this.npcCorporations.get(corporationId) ?? null;
  }

  getNpcCorporationsByFaction(factionId: number): NpcCorporation[] {
    return Array.from(this.npcCorporations.values()).filter(
      (c) => c.factionId === factionId,
    );
  }

  getNpcStation(stationId: number): NpcStation | null {
    return this.npcStations.get(stationId) ?? null;
  }

  getNpcStationsBySystem(systemId: number): NpcStation[] {
    return Array.from(this.npcStations.values()).filter(
      (s) => s.solarSystemId === systemId,
    );
  }

  getNpcStationsByCorporation(corporationId: number): NpcStation[] {
    return Array.from(this.npcStations.values()).filter(
      (s) => s.corporationId === corporationId,
    );
  }

  searchNpcStationsByName(query: string, limit = 25): NpcStation[] {
    const lowerQuery = query.toLowerCase();
    const results: NpcStation[] = [];
    for (const station of this.npcStations.values()) {
      if (station.name.toLowerCase().includes(lowerQuery)) {
        results.push(station);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // Market
  getMarketGroup(marketGroupId: number): MarketGroup | null {
    return this.marketGroups.get(marketGroupId) ?? null;
  }

  getMarketGroupsByParent(parentGroupId: number): MarketGroup[] {
    return Array.from(this.marketGroups.values()).filter(
      (g) => g.parentGroupId === parentGroupId,
    );
  }

  getRootMarketGroups(): MarketGroup[] {
    return Array.from(this.marketGroups.values()).filter(
      (g) => g.parentGroupId === null,
    );
  }

  getTypesByMarketGroup(marketGroupId: number): EveType[] {
    return Array.from(this.types.values()).filter(
      (t) => t.marketGroupId === marketGroupId,
    );
  }

  searchMarketGroupsByName(query: string, limit = 25): MarketGroup[] {
    const lowerQuery = query.toLowerCase();
    const results: MarketGroup[] = [];
    for (const group of this.marketGroups.values()) {
      if (group.name.toLowerCase().includes(lowerQuery)) {
        results.push(group);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // Meta/UI
  getMetaGroup(metaGroupId: number): MetaGroup | null {
    return this.metaGroups.get(metaGroupId) ?? null;
  }

  getAllMetaGroups(): MetaGroup[] {
    return Array.from(this.metaGroups.values());
  }

  getIcon(iconId: number): Icon | null {
    return this.icons.get(iconId) ?? null;
  }

  getGraphic(graphicId: number): Graphic | null {
    return this.graphics.get(graphicId) ?? null;
  }

  // Dogma
  getDogmaAttribute(attributeId: number): DogmaAttribute | null {
    return this.dogmaAttributes.get(attributeId) ?? null;
  }

  searchDogmaAttributesByName(query: string, limit = 25): DogmaAttribute[] {
    const lowerQuery = query.toLowerCase();
    const results: DogmaAttribute[] = [];
    for (const attr of this.dogmaAttributes.values()) {
      if (attr.name.toLowerCase().includes(lowerQuery)) {
        results.push(attr);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  getDogmaEffect(effectId: number): DogmaEffect | null {
    return this.dogmaEffects.get(effectId) ?? null;
  }

  searchDogmaEffectsByName(query: string, limit = 25): DogmaEffect[] {
    const lowerQuery = query.toLowerCase();
    const results: DogmaEffect[] = [];
    for (const effect of this.dogmaEffects.values()) {
      if (effect.name.toLowerCase().includes(lowerQuery)) {
        results.push(effect);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // Industry
  getBlueprint(blueprintTypeId: number): Blueprint | null {
    return this.blueprints.get(blueprintTypeId) ?? null;
  }

  getPlanetSchematic(planetSchematicId: number): PlanetSchematic | null {
    return this.planetSchematics.get(planetSchematicId) ?? null;
  }

  getAllPlanetSchematics(): PlanetSchematic[] {
    return Array.from(this.planetSchematics.values());
  }

  getVersion(): SdeVersionInfo {
    return { ...this.versionInfo };
  }

  close(): void {
    this.types.clear();
    this.groups.clear();
    this.categories.clear();
    this.regions.clear();
    this.constellations.clear();
    this.solarSystems.clear();
    this.stargates.clear();
    this.stars.clear();
    this.planets.clear();
    this.moons.clear();
    this.asteroidBelts.clear();
    this.factions.clear();
    this.racesMap.clear();
    this.bloodlines.clear();
    this.ancestries.clear();
    this.npcCorporations.clear();
    this.npcStations.clear();
    this.marketGroups.clear();
    this.metaGroups.clear();
    this.icons.clear();
    this.graphics.clear();
    this.dogmaAttributes.clear();
    this.dogmaEffects.clear();
    this.blueprints.clear();
    this.planetSchematics.clear();
  }
}
