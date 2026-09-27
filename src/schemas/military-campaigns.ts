import { z } from 'zod';
import { esiEnum } from './esiEnum';

/**
 * Military campaign routes exist from compatibility date 2026-08-18. Lists
 * come wrapped in an object: `{ campaigns }` for campaigns and
 * `{ objectives, cursor }` for objectives.
 */
const CampaignStateSchema = esiEnum([
  'Unspecified',
  'Active',
  'Completed',
  'Expired',
]);

/** The before/after tokens ESI returns with a page of objectives. */
const MilitaryCampaignCursorSchema = z.looseObject({
  before: z.string().optional(),
  after: z.string().optional(),
});

export const MilitaryCampaignSchema = z.looseObject({
  id: z.string(),
  state: CampaignStateSchema,
  progress: z.number(),
  started: z.string().optional(),
  finished: z.string().optional(),
});

export const MilitaryCampaignsResponseSchema = z.looseObject({
  campaigns: z.array(MilitaryCampaignSchema),
});

export const MilitaryCampaignObjectiveSchema = z.looseObject({
  id: z.string(),
  state: CampaignStateSchema,
  progress: z.number(),
  last_modified: z.string(),
  started: z.string().optional(),
  finished: z.string().optional(),
  participants: z.looseObject({
    total: z.number(),
    committed: z.number(),
    contributors: z.number(),
  }),
});

export const MilitaryCampaignObjectivesResponseSchema = z.looseObject({
  objectives: z.array(MilitaryCampaignObjectiveSchema),
  cursor: MilitaryCampaignCursorSchema.optional(),
});

export const CharacterMilitaryCampaignObjectiveSchema = z.looseObject({
  id: z.string(),
  campaign_id: z.string(),
  is_committed: z.boolean(),
  contributed: z.number(),
  last_modified: z.string(),
});

export const CharacterMilitaryCampaignObjectivesResponseSchema = z.looseObject({
  objectives: z.array(CharacterMilitaryCampaignObjectiveSchema),
  cursor: MilitaryCampaignCursorSchema.optional(),
});
