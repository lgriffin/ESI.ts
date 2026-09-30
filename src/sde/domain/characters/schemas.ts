/**
 * SDE domain: factions, races, bloodlines, ancestries, character reference tables, skills and NPC characters.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const AgentTypeSchema = z.looseObject({
  agentTypeId: z.number().int(),
  name: z.string(),
});

export const AgentInSpaceSchema = z.looseObject({
  characterId: z.number().int(),
  dungeonId: z.number().int(),
  solarSystemId: z.number().int(),
  spawnPointId: z.number().int(),
  typeId: z.number().int(),
});

export const AncestrySchema = z.looseObject({
  ancestryId: z.number().int(),
  bloodlineId: z.number().int(),
  charisma: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  intelligence: z.number().int(),
  memory: z.number().int(),
  name: z.string(),
  perception: z.number().int(),
  shortDescription: z.string(),
  willpower: z.number().int(),
});

export const BloodlineSchema = z.looseObject({
  bloodlineId: z.number().int(),
  charisma: z.number().int(),
  corporationId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  intelligence: z.number().int(),
  memory: z.number().int(),
  name: z.string(),
  perception: z.number().int(),
  raceId: z.number().int(),
  willpower: z.number().int(),
});

export const CertificateSchema = z.looseObject({
  certificateId: z.number().int(),
  description: z.string(),
  groupId: z.number().int(),
  name: z.string(),
  recommendedFor: z.unknown(),
  skillTypes: z.unknown(),
});

export const CharacterAttributeSchema = z.looseObject({
  attributeId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  notes: z.string(),
  shortDescription: z.string(),
});

export const CharacterTitleSchema = z.looseObject({
  name: z.string(),
});

export const CloneGradeSchema = z.looseObject({
  cloneGradeId: z.number().int(),
  name: z.string(),
  skills: z.unknown(),
});

export const ExpertSystemSchema = z.looseObject({
  expertSystemId: z.number().int(),
  durationDays: z.number().int(),
  hidden: z.boolean(),
  internalName: z.string(),
  retired: z.boolean(),
  skillsGranted: z.unknown(),
  associatedShipTypes: z.unknown().nullable(),
});

export const FactionSchema = z.looseObject({
  factionId: z.number().int(),
  corporationId: z.number().int(),
  description: z.string(),
  flatLogo: z.string(),
  flatLogoWithName: z.string(),
  iconId: z.number().int(),
  memberRaces: z.array(z.number().int()),
  militiaCorporationId: z.number().int(),
  name: z.string(),
  shortDescription: z.string(),
  sizeFactor: z.number(),
  solarSystemId: z.number().int(),
  uniqueName: z.boolean(),
});

export const NpcCharacterSchema = z.looseObject({
  characterId: z.number().int(),
  bloodlineId: z.number().int(),
  ceo: z.boolean(),
  corporationId: z.number().int(),
  gender: z.number().int(),
  locationId: z.number().int(),
  name: z.string(),
  raceId: z.number().int(),
  startDate: z.string(),
  uniqueName: z.boolean(),
  skills: z.unknown().nullable(),
  ancestryId: z.number().int().nullable(),
  careerId: z.number().int().nullable(),
  schoolId: z.number().int().nullable(),
  specialityId: z.number().int().nullable(),
  agent: z
    .looseObject({
      agentTypeId: z.number().int(),
      divisionId: z.number().int(),
      isLocator: z.boolean(),
      level: z.number().int(),
    })
    .optional(),
  description: z.string().optional(),
});

export const RaceSchema = z.looseObject({
  raceId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  shipTypeId: z.number().int(),
  skills: z.unknown(),
});

export const SchoolMapSchema = z.looseObject({
  schoolMapId: z.number().int(),
  schoolId: z.number().int(),
  solarSystemId: z.number().int(),
});

export const SchoolSchema = z.looseObject({
  schoolId: z.number().int(),
  careerAgents: z.unknown(),
  careerId: z.number().int(),
  characterDescription: z.string(),
  corporationId: z.number().int(),
  description: z.string(),
  iconId: z.number().int(),
  name: z.string(),
  raceId: z.number().int(),
  startingStations: z.unknown(),
  title: z.string(),
  isStarterSpaceSchool: z.string().nullable(),
});

export const SkillPlanSchema = z.looseObject({
  skillPlanId: z.number().int(),
  careerPathId: z.number().int(),
  description: z.string(),
  factionId: z.number().int(),
  internalName: z.string(),
  milestones: z.unknown(),
  name: z.string(),
  skillRequirements: z.unknown(),
  npcCorporationDivision: z.string().nullable(),
});
