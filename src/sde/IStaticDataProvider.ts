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

  getVersion(): SdeVersionInfo;

  close(): void;
}
