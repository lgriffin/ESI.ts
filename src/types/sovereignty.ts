import { z } from 'zod';
import {
  SovereigntyCampaignSchema,
  SovereigntySystemStructureSchema,
  SovereigntySystemSchema,
} from '../schemas/sovereignty';

export type SovereigntyCampaign = z.infer<typeof SovereigntyCampaignSchema>;
export type SovereigntySystemStructure = z.infer<
  typeof SovereigntySystemStructureSchema
>;
export type SovereigntySystem = z.infer<typeof SovereigntySystemSchema>;
