/**
 * SDE domain: NPC corporations, their divisions, stations, roles and station operations.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

import type { Position3D } from '../universe/types';

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
