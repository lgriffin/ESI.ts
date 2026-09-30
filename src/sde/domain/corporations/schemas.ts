/**
 * SDE domain: NPC corporations, their divisions, stations, roles and station operations.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

import { Position3DSchema } from '../universe/schemas';

export const CorporationActivitySchema = z.looseObject({
  corporationActivityId: z.number().int(),
  name: z.string(),
});

export const CorporationRoleGroupSchema = z.looseObject({
  corporationRoleGroupId: z.number().int(),
  appliesTo: z.string(),
  appliesToGrantable: z.string(),
  isDivisional: z.boolean(),
  isLocational: z.boolean(),
  name: z.string(),
});

export const CorporationRoleSchema = z.looseObject({
  corporationRoleId: z.number().int(),
  description: z.string(),
  name: z.string(),
  roleGroupIDs: z.unknown(),
  shortName: z.string(),
});

export const NpcCorporationDivisionSchema = z.looseObject({
  npcCorporationDivisionId: z.number().int(),
  displayName: z.string(),
  internalName: z.string(),
  leaderTypeName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

export const NpcCorporationSchema = z.looseObject({
  corporationId: z.number().int(),
  ceoId: z.number().int(),
  deleted: z.boolean(),
  description: z.string(),
  extent: z.string(),
  hasPlayerPersonnelManager: z.boolean(),
  initialPrice: z.number(),
  memberLimit: z.number().int(),
  minSecurity: z.number(),
  minimumJoinStanding: z.number(),
  name: z.string(),
  sendCharTerminationMessage: z.boolean(),
  shares: z.number(),
  size: z.string(),
  stationId: z.number().int(),
  taxRate: z.number(),
  tickerName: z.string(),
  uniqueName: z.boolean(),
  allowedMemberRaces: z.unknown().nullable(),
  corporationTrades: z.unknown().nullable(),
  divisions: z.unknown().nullable(),
  enemyId: z.number().int().nullable(),
  factionId: z.number().int().nullable(),
  friendId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  investors: z.unknown().nullable(),
  lpOfferTables: z.unknown().nullable(),
  mainActivityId: z.number().int().nullable(),
  raceId: z.number().int().nullable(),
  sizeFactor: z.number().nullable(),
  solarSystemId: z.number().int().nullable(),
  secondaryActivityId: z.number().int().nullable(),
  exchangeRates: z.record(z.string(), z.number()).optional(),
});

export const NpcStationSchema = z.looseObject({
  stationId: z.number().int(),
  celestialIndex: z.number().int(),
  operationId: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  ownerId: z.number().int(),
  position: Position3DSchema,
  reprocessingEfficiency: z.number(),
  reprocessingHangarFlag: z.number().int(),
  reprocessingStationsTake: z.number(),
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
  useOperationName: z.boolean(),
});

export const StationOperationSchema = z.looseObject({
  stationOperationId: z.number().int(),
  activityId: z.number().int(),
  border: z.number(),
  corridor: z.number(),
  description: z.string(),
  fringe: z.number(),
  hub: z.number(),
  manufacturingFactor: z.number(),
  operationName: z.string(),
  ratio: z.number(),
  researchFactor: z.number(),
  services: z.unknown(),
  stationTypes: z.unknown(),
});

export const StationServiceSchema = z.looseObject({
  stationServiceId: z.number().int(),
  serviceName: z.string(),
  description: z.string().nullable(),
});

export const StationStandingsRestrictionSchema = z.looseObject({
  stationStandingsRestrictionId: z.number().int(),
  services: z.unknown(),
});
