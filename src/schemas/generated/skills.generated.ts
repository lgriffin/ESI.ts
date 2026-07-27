 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdAttributesGetSchema = z.looseObject({
  accrued_remap_cooldown_date: z.string().optional(),
  bonus_remaps: z.number().optional(),
  charisma: z.number(),
  intelligence: z.number(),
  last_remap_date: z.string().optional(),
  memory: z.number(),
  perception: z.number(),
  willpower: z.number(),
});

export const CharactersSkillqueueSkillSchema = z.looseObject({
  finish_date: z.string().optional(),
  finished_level: z.number(),
  level_end_sp: z.number().optional(),
  level_start_sp: z.number().optional(),
  queue_position: z.number(),
  skill_id: z.number(),
  start_date: z.string().optional(),
  training_start_sp: z.number().optional(),
});

export const CharactersSkillsSchema = z.looseObject({
  skills: z.array(z.looseObject({
    active_skill_level: z.number(),
    skill_id: z.number(),
    skillpoints_in_skill: z.number(),
    trained_skill_level: z.number(),
  })),
  total_sp: z.number(),
  unallocated_sp: z.number().optional(),
});
