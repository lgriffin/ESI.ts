export interface EveType {
  typeId: number;
  groupId: number;
  name: string;
  description: string;
  mass: number | null;
  volume: number | null;
  capacity: number | null;
  portionSize: number;
  published: boolean;
  marketGroupId: number | null;
  iconId: number | null;
  graphicId: number | null;
}

export interface EveGroup {
  groupId: number;
  categoryId: number;
  name: string;
  published: boolean;
}

export interface EveCategory {
  categoryId: number;
  name: string;
  published: boolean;
}

export interface Region {
  regionId: number;
  name: string;
  description: string | null;
}

export interface Constellation {
  constellationId: number;
  regionId: number;
  name: string;
}

export interface SolarSystem {
  systemId: number;
  constellationId: number;
  regionId: number;
  name: string;
  securityStatus: number;
  securityClass: string | null;
}

export interface Stargate {
  stargateId: number;
  systemId: number;
  typeId: number;
  destinationStargateId: number;
  destinationSystemId: number;
}
