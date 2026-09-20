import { z } from 'zod';

export const MilitaryCampaignSchema = z.looseObject({
  campaign_id: z.string(),
  state: z.string(),
  progress: z.number(),
  start_time: z.string(),
  finish_time: z.string().optional(),
});

export const MilitaryCampaignObjectiveSchema = z.looseObject({
  objective_id: z.string(),
  campaign_id: z.string(),
  state: z.string(),
  progress: z.number(),
  participants: z.looseObject({
    total: z.number(),
    committed: z.number(),
    contributors: z.number(),
  }),
});

export const CharacterMilitaryCampaignObjectiveSchema = z.looseObject({
  objective_id: z.string(),
  campaign_id: z.string(),
  committed: z.boolean(),
  contribution: z.number(),
});
