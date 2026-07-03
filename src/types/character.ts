import { z } from 'zod';
import {
  CharacterInfoSchema,
  CharacterPortraitSchema,
  CharacterAttributesSchema,
  AgentResearchSchema,
  BlueprintSchema,
  CorporationHistorySchema,
  JumpFatigueSchema,
  MedalSchema,
  NotificationSchema,
  StandingSchema,
  CharacterTitleSchema,
  CharacterAffiliationSchema,
  CharacterRoleSchema,
} from '../schemas/character';

export type CharacterInfo = z.infer<typeof CharacterInfoSchema>;
export type CharacterPortrait = z.infer<typeof CharacterPortraitSchema>;
export type CharacterAttributes = z.infer<typeof CharacterAttributesSchema>;
export type AgentResearch = z.infer<typeof AgentResearchSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
export type CorporationHistory = z.infer<typeof CorporationHistorySchema>;
export type JumpFatigue = z.infer<typeof JumpFatigueSchema>;
export type Medal = z.infer<typeof MedalSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Standing = z.infer<typeof StandingSchema>;
export type CharacterTitle = z.infer<typeof CharacterTitleSchema>;
export type CharacterAffiliation = z.infer<typeof CharacterAffiliationSchema>;
export type CharacterRole = z.infer<typeof CharacterRoleSchema>;
