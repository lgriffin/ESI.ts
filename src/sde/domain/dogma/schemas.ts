/**
 * SDE domain: dogma attributes, effects, units and buff collections.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const DbuffCollectionSchema = z.looseObject({
  dbuffCollectionId: z.number().int(),
  aggregateMode: z.string(),
  developerDescription: z.unknown(),
  itemModifiers: z.unknown(),
  locationGroupModifiers: z.unknown(),
  locationModifiers: z.unknown(),
  locationRequiredSkillModifiers: z.unknown(),
  operationName: z.string(),
  showOutputValueInUI: z.string(),
  displayName: z.string().nullable(),
});

export const DogmaAttributeCategorySchema = z.looseObject({
  attributeCategoryId: z.number().int(),
  description: z.string(),
  name: z.string(),
});

export const DogmaAttributeSchema = z.looseObject({
  attributeId: z.number().int(),
  attributeCategoryId: z.number().int(),
  dataType: z.number().int(),
  defaultValue: z.number(),
  description: z.string(),
  displayWhenZero: z.boolean(),
  highIsGood: z.boolean(),
  name: z.string(),
  published: z.boolean(),
  stackable: z.boolean(),
  displayName: z.string().nullable(),
  iconId: z.number().int().nullable(),
  tooltipDescription: z.string().nullable(),
  tooltipTitle: z.string().nullable(),
  unitId: z.number().int().nullable(),
  chargeRechargeTimeId: z.number().int().nullable(),
  maxAttributeId: z.number().int().nullable(),
  minAttributeId: z.number().int().nullable(),
});

export const DogmaEffectSchema = z.looseObject({
  effectId: z.number().int(),
  disallowAutoRepeat: z.boolean(),
  dischargeAttributeId: z.number().int(),
  durationAttributeId: z.number().int(),
  effectCategoryId: z.number().int(),
  electronicChance: z.boolean(),
  guid: z.string(),
  isAssistance: z.boolean(),
  isOffensive: z.boolean(),
  isWarpSafe: z.boolean(),
  name: z.string(),
  propulsionChance: z.boolean(),
  published: z.boolean(),
  rangeChance: z.boolean(),
  distribution: z.string().nullable(),
  falloffAttributeId: z.number().int().nullable(),
  rangeAttributeId: z.number().int().nullable(),
  trackingSpeedAttributeId: z.number().int().nullable(),
  description: z.string().nullable(),
  displayName: z.string().nullable(),
  iconId: z.number().int().nullable(),
  modifierInfo: z.unknown().nullable(),
  fittingUsageChanceAttributeId: z.number().int().optional(),
  npcActivationChanceAttributeId: z.number().int().optional(),
  npcUsageChanceAttributeId: z.number().int().optional(),
  resistanceAttributeId: z.number().int().optional(),
});

export const DogmaUnitSchema = z.looseObject({
  unitId: z.number().int(),
  description: z.string(),
  displayName: z.string(),
  name: z.string(),
});
