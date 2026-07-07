import { z } from 'zod';

export const CharacterInfoSchema = z.looseObject({
  character_id: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  ancestry_id: z.number().optional(),
  bloodline_id: z.number(),
  race_id: z.number(),
  gender: z.enum(['male', 'female']),
  security_status: z.number().optional(),
  title: z.string().optional(),
  birthday: z.string(),
});

export const CharacterPortraitSchema = z.looseObject({
  px64x64: z.string().optional(),
  px128x128: z.string().optional(),
  px256x256: z.string().optional(),
  px512x512: z.string().optional(),
});

export const CharacterAttributesSchema = z.looseObject({
  charisma: z.number(),
  intelligence: z.number(),
  memory: z.number(),
  perception: z.number(),
  willpower: z.number(),
  bonus_remaps: z.number().optional(),
  last_remap_date: z.string().optional(),
  accrued_remap_cooldown_date: z.string().optional(),
});

export const AgentResearchSchema = z.looseObject({
  agent_id: z.number(),
  skill_type_id: z.number(),
  started_at: z.string(),
  points_per_day: z.number(),
  remainder_points: z.number(),
});

export const BlueprintSchema = z.looseObject({
  item_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  location_flag: z.string(),
  quantity: z.number(),
  time_efficiency: z.number(),
  material_efficiency: z.number(),
  runs: z.number(),
});

export const CorporationHistorySchema = z.looseObject({
  corporation_id: z.number(),
  record_id: z.number(),
  start_date: z.string(),
  is_deleted: z.boolean().optional(),
});

export const JumpFatigueSchema = z.looseObject({
  jump_fatigue_expire_date: z.string().optional(),
  last_jump_date: z.string().optional(),
  last_update_date: z.string().optional(),
});

export const MedalSchema = z.looseObject({
  medal_id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  issuer_id: z.number(),
  corporation_id: z.number(),
  reason: z.string(),
  status: z.enum(['private', 'public']),
  graphics: z.array(
    z.looseObject({
      part: z.number(),
      layer: z.number(),
      graphic: z.string(),
      color: z.number().optional(),
    }),
  ),
});

export const NotificationSchema = z.looseObject({
  notification_id: z.number(),
  type: z.string(),
  sender_id: z.number(),
  sender_type: z.enum([
    'character',
    'corporation',
    'alliance',
    'faction',
    'other',
  ]),
  timestamp: z.string(),
  text: z.string().optional(),
  is_read: z.boolean().optional(),
});

export const StandingSchema = z.looseObject({
  from_id: z.number(),
  from_type: z.enum(['agent', 'npc_corp', 'faction']),
  standing: z.number(),
});

export const CharacterTitleSchema = z.looseObject({
  title_id: z.number(),
  name: z.string(),
});

export const CharacterAffiliationSchema = z.looseObject({
  character_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  faction_id: z.number().optional(),
});

export const ContactNotificationSchema = z.looseObject({
  notification_id: z.number(),
  sender_character_id: z.number(),
  message: z.string(),
  send_date: z.string(),
  standing_level: z.number(),
});

export const CharacterRoleSchema = z.looseObject({
  roles: z.array(z.string()).optional(),
  roles_at_hq: z.array(z.string()).optional(),
  roles_at_base: z.array(z.string()).optional(),
  roles_at_other: z.array(z.string()).optional(),
});
