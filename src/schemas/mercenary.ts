import { z } from 'zod';
import { esiEnum } from './esiEnum';

/** One entry in `GET /characters/{character_id}/structures/mercenary-dens`. */
export const MercenaryDenSchema = z.looseObject({
  id: z.number(),
  planet_id: z.number(),
});

/** `GET /characters/{character_id}/structures/mercenary-dens`: ESI wraps the list in `mercenary_dens`. */
export const MercenaryDensResponseSchema = z.looseObject({
  mercenary_dens: z.array(MercenaryDenSchema),
});

/** One entry in `GET /characters/{character_id}/mercenary-tactical-operations`. */
export const MercenaryTacticalOperationSchema = z.looseObject({
  id: z.string(),
  mercenary_den_id: z.number(),
});

/** `GET /characters/{character_id}/mercenary-tactical-operations`: ESI wraps the list in `operations`. */
export const MercenaryTacticalOperationsResponseSchema = z.looseObject({
  operations: z.array(MercenaryTacticalOperationSchema),
});

const MercenaryDenDetailEvolutionLevelSchema = z.looseObject({
  amount: z.number(),
  level: esiEnum([
    'Unspecified',
    'Level0',
    'Level1',
    'Level2',
    'Level3',
    'Level4',
  ]),
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
