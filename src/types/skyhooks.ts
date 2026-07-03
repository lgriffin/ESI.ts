import { z } from 'zod';
import {
  SovereigntyHubSchema,
  OrbitalSkyhookSchema,
  RaidableSkyhookSchema,
} from '../schemas/skyhooks';

export type SovereigntyHub = z.infer<typeof SovereigntyHubSchema>;
export type OrbitalSkyhook = z.infer<typeof OrbitalSkyhookSchema>;
export type RaidableSkyhook = z.infer<typeof RaidableSkyhookSchema>;
