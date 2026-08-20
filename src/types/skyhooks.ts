import { z } from 'zod';
import {
  SovereigntyHubSchema,
  OrbitalSkyhookSchema,
  RaidableSkyhookSchema,
  SkyhookDetailSchema,
  SovereigntyHubDetailSchema,
} from '../schemas/skyhooks';

export type SovereigntyHub = z.infer<typeof SovereigntyHubSchema>;
export type OrbitalSkyhook = z.infer<typeof OrbitalSkyhookSchema>;
export type RaidableSkyhook = z.infer<typeof RaidableSkyhookSchema>;
export type SkyhookDetail = z.infer<typeof SkyhookDetailSchema>;
export type SovereigntyHubDetail = z.infer<typeof SovereigntyHubDetailSchema>;
