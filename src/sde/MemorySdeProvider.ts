import type { IStaticDataProvider } from './IStaticDataProvider';
import type {
  EveType,
  EveGroup,
  EveCategory,
  Region,
  Constellation,
  SolarSystem,
  Stargate,
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
  }
}
