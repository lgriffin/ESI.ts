/**
 * SDE domain: missions, dungeons, epic arcs, campaigns and notification types.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const DungeonSchema = z.looseObject({
  dungeonId: z.number().int(),
  allowedShipsList: z.unknown(),
  archetypeId: z.number().int(),
  description: z.string(),
  factionId: z.number().int(),
  name: z.string(),
});

export const EpicArcSchema = z.looseObject({
  epicArcId: z.number().int(),
  arcRestartInterval: z.number().int(),
  factionId: z.number().int(),
  iconId: z.number().int(),
  missions: z.unknown(),
  name: z.string(),
});

export const FreelanceJobSchemaSchema = z.looseObject({
  freelanceJobSchemaGroupId: z.number().int(),
  BoostShield: z.unknown(),
  CaptureFWComplex: z.unknown(),
  DamageShip: z.unknown(),
  DefendFWComplex: z.unknown(),
  DeliverItem: z.unknown(),
  KillCapsuleer: z.unknown(),
  KillNPC: z.unknown(),
  MineOre: z.unknown(),
  RepairArmor: z.unknown(),
  ShipInsurance: z.unknown(),
});

export const MercenaryTacticalOperationSchema = z.looseObject({
  mercenaryTacticalOperationId: z.number().int(),
  anarchyImpact: z.number().int(),
  description: z.string(),
  developmentImpact: z.number().int(),
  dungeonId: z.number().int(),
  infomorphBonus: z.number().int(),
  name: z.string(),
});

export const MilitaryCampaignObjectiveSchema = z.looseObject({
  militaryCampaignObjectiveId: z.string(),
  campaignId: z.string(),
  careerPath: z.string(),
  contentTags: z.unknown(),
  contributionMethodConfiguration: z.unknown(),
  issuer: z.unknown(),
  maxProgressPerParticipant: z.number().int(),
  presentingCharacterId: z.number().int(),
  rewards: z.unknown(),
  subtitle: z.string(),
  targetProgress: z.number().int(),
  title: z.string(),
  annotations: z.unknown().nullable(),
});

export const MilitaryCampaignSchema = z.looseObject({
  militaryCampaignId: z.string(),
  annotations: z.unknown(),
  issuer: z.unknown(),
  subtitle: z.string(),
  targetProgress: z.number().int(),
  title: z.string(),
});

export const MissionSchema = z.looseObject({
  missionId: z.number().int(),
  hasStandingRewards: z.boolean(),
  killMission: z.unknown(),
  messages: z.unknown(),
  name: z.string(),
  expirationTime: z.string().nullable(),
  factionId: z.number().int().nullable(),
});

export const NotificationTypeSchema = z.looseObject({
  notificationTypeId: z.number().int(),
  displayName: z.string(),
  internalName: z.string(),
});
