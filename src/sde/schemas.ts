import { z } from 'zod';

export const EveTypeSchema = z.looseObject({
  typeId: z.number().int(),
  groupId: z.number().int(),
  name: z.string(),
  description: z.string(),
  mass: z.number().nullable(),
  volume: z.number().nullable(),
  capacity: z.number().nullable(),
  portionSize: z.number().int(),
  published: z.boolean(),
  marketGroupId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  graphicId: z.number().int().nullable(),
});

export const EveGroupSchema = z.looseObject({
  groupId: z.number().int(),
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
});

export const EveCategorySchema = z.looseObject({
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
});

export const RegionSchema = z.looseObject({
  regionId: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});

export const ConstellationSchema = z.looseObject({
  constellationId: z.number().int(),
  regionId: z.number().int(),
  name: z.string(),
});

export const SolarSystemSchema = z.looseObject({
  systemId: z.number().int(),
  constellationId: z.number().int(),
  regionId: z.number().int(),
  name: z.string(),
  securityStatus: z.number(),
  securityClass: z.string().nullable(),
});

export const StargateSchema = z.looseObject({
  stargateId: z.number().int(),
  systemId: z.number().int(),
  typeId: z.number().int(),
  destinationStargateId: z.number().int(),
  destinationSystemId: z.number().int(),
});

export const SdeVersionSchema = z.looseObject({
  version: z.string(),
  buildDate: z.string(),
  importedAt: z.string(),
  checksum: z.string().optional(),
});
