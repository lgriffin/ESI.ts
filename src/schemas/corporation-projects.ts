import { z } from 'zod';

export const CorporationProjectSchema = z.looseObject({
  project_id: z.number(),
  state: z.string(),
  progress: z.number(),
  start_time: z.string(),
  finish_time: z.string().optional(),
});

export const CorporationProjectContributionSchema = z.looseObject({
  character_id: z.number(),
  contribution: z.number(),
});

export const CorporationProjectContributorSchema = z.looseObject({
  character_id: z.number(),
  contribution: z.number(),
});
