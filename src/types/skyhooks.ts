import { z } from 'zod';
import {
  SovereigntyHubSchema,
  SovereigntyHubsResponseSchema,
  OrbitalSkyhookSchema,
  OrbitalSkyhooksResponseSchema,
  RaidableSkyhookSchema,
  RaidableSkyhooksResponseSchema,
  SkyhookDetailSchema,
  SovereigntyHubDetailSchema,
} from '../schemas/skyhooks';

export type SovereigntyHub = z.infer<typeof SovereigntyHubSchema>;
export type OrbitalSkyhook = z.infer<typeof OrbitalSkyhookSchema>;
export type SovereigntyHubsResponse = z.infer<
  typeof SovereigntyHubsResponseSchema
>;
export type OrbitalSkyhooksResponse = z.infer<
  typeof OrbitalSkyhooksResponseSchema
>;
export type RaidableSkyhook = z.infer<typeof RaidableSkyhookSchema>;
export type RaidableSkyhooksResponse = z.infer<
  typeof RaidableSkyhooksResponseSchema
>;
export type SkyhookDetail = z.infer<typeof SkyhookDetailSchema>;
export type SovereigntyHubDetail = z.infer<typeof SovereigntyHubDetailSchema>;
