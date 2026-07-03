import { z } from 'zod';

export const SovereigntyHubSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  online: z.boolean(),
  remaining_reagents: z.number().optional(),
  installed_upgrades: z.array(z.number()).optional(),
});

export const OrbitalSkyhookSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  online: z.boolean(),
  reagent_silo_capacity: z.number().optional(),
  reagent_silo_level: z.number().optional(),
});

export const RaidableSkyhookSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  raidable_at: z.string().optional(),
  is_raidable: z.boolean(),
});
