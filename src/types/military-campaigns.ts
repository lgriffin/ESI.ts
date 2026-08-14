import { z } from 'zod';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectiveSchema,
} from '../schemas/military-campaigns';

export type MilitaryCampaign = z.infer<typeof MilitaryCampaignSchema>;
export type MilitaryCampaignObjective = z.infer<
  typeof MilitaryCampaignObjectiveSchema
>;
export type CharacterMilitaryCampaignObjective = z.infer<
  typeof CharacterMilitaryCampaignObjectiveSchema
>;
