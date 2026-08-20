import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const MercenaryDenSchema = z.looseObject({
  den_id: z.number(),
  system_id: z.number(),
  constellation_id: z.number(),
  region_id: z.number(),
  development_level: z.number().optional(),
  anarchy_level: z.number().optional(),
  active_operations: z.number().optional(),
});

export const MercenaryTacticalOperationSchema = z.looseObject({
  operation_id: z.number(),
  den_id: z.number(),
  system_id: z.number(),
  site_type: z.string(),
  status: esiEnum(['spawning', 'active', 'completed', 'expired']),
  started_at: z.string().optional(),
  expires_at: z.string().optional(),
});

const MercenaryDenDetailEvolutionLevelSchema = z.looseObject({
  level: z.number().optional(),
  progress: z.number().optional(),
});

export const MercenaryDenDetailEvolutionSchema = z.looseObject({
  development: MercenaryDenDetailEvolutionLevelSchema,
  anarchy: MercenaryDenDetailEvolutionLevelSchema,
});

export const MercenaryDenDetailInfomorphsSchema = z.looseObject({
  amount: z.number(),
});

export const MercenaryDenDetailReinforcementTimerSchema = z.looseObject({
  end: z.string(),
});

export const MercenaryDenDetailSkyhookSchema = z.looseObject({
  id: z.number(),
  planet_id: z.number(),
  corporation_id: z.number(),
});

export const MercenaryDenDetailSchema = z.looseObject({
  id: z.number(),
  type_id: z.number(),
  state: esiEnum(['Unspecified', 'Running', 'Paused', 'Disabled']),
  skyhook: MercenaryDenDetailSkyhookSchema,
  infomorphs: MercenaryDenDetailInfomorphsSchema,
  evolution: MercenaryDenDetailEvolutionSchema,
  reinforcement_timer: MercenaryDenDetailReinforcementTimerSchema.optional(),
});

export const MercenaryTacticalOperationDetailSchema = z.looseObject({
  id: z.string(),
  mercenary_den_id: z.number(),
  state: esiEnum([
    'Unspecified',
    'Available',
    'Started',
    'Completed',
    'Expired',
    'Removed',
  ]),
  dungeon_type_id: z.number(),
  expires: z.string(),
});
