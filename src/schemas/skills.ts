import { z } from 'zod';

export const CharacterSkillSchema = z.looseObject({
  skill_id: z.number(),
  skillpoints_in_skill: z.number(),
  trained_skill_level: z.number(),
  active_skill_level: z.number(),
});

export const SkillQueueSchema = z.looseObject({
  skill_id: z.number(),
  finished_level: z.number(),
  queue_position: z.number(),
  level_end_sp: z.number().optional(),
  level_start_sp: z.number().optional(),
  training_start_sp: z.number().optional(),
  start_date: z.string().optional(),
  finish_date: z.string().optional(),
});
