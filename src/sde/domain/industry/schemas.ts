/**
 * SDE domain: blueprints, planetary schematics and the industry reference tables.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const BlueprintMaterialSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
});

export const BlueprintProductSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
  probability: z.number().optional(),
});

export const BlueprintActivitySchema = z.looseObject({
  time: z.number().int(),
  materials: z.array(BlueprintMaterialSchema).optional(),
  products: z.array(BlueprintProductSchema).optional(),
});

export const BlueprintActivitiesSchema = z.looseObject({
  manufacturing: BlueprintActivitySchema.optional(),
  research_material: BlueprintActivitySchema.optional(),
  research_time: BlueprintActivitySchema.optional(),
  copying: BlueprintActivitySchema.optional(),
  invention: BlueprintActivitySchema.optional(),
});

export const BlueprintSchema = z.looseObject({
  activities: BlueprintActivitiesSchema,
  blueprintTypeId: z.number().int(),
  maxProductionLimit: z.number().int(),
});

export const ControlTowerResourceSchema = z.looseObject({
  typeId: z.number().int(),
  resources: z.unknown(),
});

export const IndustryActivitySchema = z.looseObject({
  industryActivityId: z.number().int(),
  description: z.string(),
  name: z.string(),
});

export const IndustryAssemblyLineSchema = z.looseObject({
  assemblyLineId: z.number().int(),
  activityId: z.number().int(),
  baseMaterialMultiplier: z.number(),
  baseTimeMultiplier: z.number(),
  description: z.string(),
  name: z.string(),
  detailsPerGroup: z.unknown().nullable(),
  baseCostMultiplier: z.number().nullable(),
  detailsPerCategory: z.unknown().nullable(),
});

export const IndustryInstallationTypeSchema = z.looseObject({
  installationTypeId: z.number().int(),
  assemblyLines: z.unknown(),
});

export const IndustryModifierSourceSchema = z.looseObject({
  modifierSourceId: z.number().int(),
  copying: z.unknown(),
  invention: z.unknown(),
  manufacturing: z.unknown(),
  researchMaterial: z.unknown(),
  researchTime: z.unknown(),
  reaction: z.unknown().nullable(),
});

export const IndustryTargetFilterSchema = z.looseObject({
  targetFilterId: z.number().int(),
  categoryIDs: z.unknown(),
  name: z.string(),
  groupIDs: z.unknown().nullable(),
});

export const PlanetSchematicSchema = z.looseObject({
  planetSchematicId: z.number().int(),
  cycleTime: z.number().int(),
  name: z.string(),
  pins: z.unknown(),
  types: z.unknown(),
});
