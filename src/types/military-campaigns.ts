import { z } from 'zod';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignsResponseSchema,
  MilitaryCampaignObjectiveSchema,
  MilitaryCampaignObjectivesResponseSchema,
  CharacterMilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectivesResponseSchema,
} from '../schemas/military-campaigns';

export type MilitaryCampaign = z.infer<typeof MilitaryCampaignSchema>;
export type MilitaryCampaignsResponse = z.infer<
  typeof MilitaryCampaignsResponseSchema
>;
export type MilitaryCampaignObjective = z.infer<
  typeof MilitaryCampaignObjectiveSchema
>;
export type MilitaryCampaignObjectivesResponse = z.infer<
  typeof MilitaryCampaignObjectivesResponseSchema
>;
export type CharacterMilitaryCampaignObjective = z.infer<
  typeof CharacterMilitaryCampaignObjectiveSchema
>;
export type CharacterMilitaryCampaignObjectivesResponse = z.infer<
  typeof CharacterMilitaryCampaignObjectivesResponseSchema
>;
