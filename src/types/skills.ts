import { z } from 'zod';
import { CharacterSkillSchema, SkillQueueSchema } from '../schemas/skills';

export type CharacterSkill = z.infer<typeof CharacterSkillSchema>;
export type SkillQueue = z.infer<typeof SkillQueueSchema>;
