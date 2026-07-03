import { z } from 'zod';

export const CorporationInfoSchema = z.looseObject({
  corporation_id: z.number().optional(),
  name: z.string(),
  ticker: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  alliance_id: z.number().optional(),
  ceo_id: z.number(),
  creator_id: z.number(),
  date_founded: z.string().optional(),
  faction_id: z.number().optional(),
  home_station_id: z.number().optional(),
  member_count: z.number(),
  shares: z.number().optional(),
  tax_rate: z.number(),
  war_eligible: z.boolean().optional(),
});

export const CorporationAllianceHistorySchema = z.looseObject({
  alliance_id: z.number().optional(),
  is_deleted: z.boolean().optional(),
  record_id: z.number(),
  start_date: z.string(),
});

export const CorporationMedalSchema = z.looseObject({
  medal_id: z.number(),
  title: z.string(),
  description: z.string(),
  creator_id: z.number(),
  date: z.string(),
});

export const CorporationStarbaseSchema = z.looseObject({
  starbase_id: z.number(),
  type_id: z.number(),
  system_id: z.number(),
  state: z.enum(['offline', 'online', 'onlining', 'reinforced', 'unanchoring']),
  moon_id: z.number().optional(),
  onlined_since: z.string().optional(),
  reinforced_until: z.string().optional(),
  unanchor_at: z.string().optional(),
});

export const CorporationDivisionsSchema = z.looseObject({
  hangar: z
    .array(
      z.looseObject({
        division: z.number(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  wallet: z
    .array(
      z.looseObject({
        division: z.number(),
        name: z.string().optional(),
      }),
    )
    .optional(),
});

export const CorporationFacilitySchema = z.looseObject({
  facility_id: z.number(),
  type_id: z.number(),
  system_id: z.number(),
});

export const CorporationIssuedMedalSchema = z.looseObject({
  medal_id: z.number(),
  title: z.string(),
  description: z.string(),
  character_id: z.number(),
  issued_at: z.string(),
  issuer_id: z.number(),
  reason: z.string(),
  status: z.enum(['private', 'public']),
});

export const CorporationMemberTitleSchema = z.looseObject({
  character_id: z.number(),
  titles: z.array(z.number()),
});

export const CorporationMemberTrackingSchema = z.looseObject({
  character_id: z.number(),
  start_date: z.string(),
  base_id: z.number().optional(),
  location_id: z.number().optional(),
  logoff_date: z.string().optional(),
  logon_date: z.string().optional(),
  online: z.boolean().optional(),
  ship_type_id: z.number().optional(),
});

export const CorporationMemberRoleSchema = z.looseObject({
  character_id: z.number(),
  roles: z.array(z.string()).optional(),
  grantable_roles: z.array(z.string()).optional(),
  roles_at_hq: z.array(z.string()).optional(),
  grantable_roles_at_hq: z.array(z.string()).optional(),
  roles_at_base: z.array(z.string()).optional(),
  grantable_roles_at_base: z.array(z.string()).optional(),
  roles_at_other: z.array(z.string()).optional(),
  grantable_roles_at_other: z.array(z.string()).optional(),
});

export const CorporationRoleHistorySchema = z.looseObject({
  character_id: z.number(),
  changed_at: z.string(),
  issuer_id: z.number(),
  role_type: z.string(),
  before: z.array(z.string()),
  after: z.array(z.string()),
});

export const CorporationShareholderSchema = z.looseObject({
  shareholder_id: z.number(),
  shareholder_type: z.enum(['character', 'corporation']),
  share_count: z.number(),
});

export const CorporationStarbaseDetailSchema = z.looseObject({
  state: z.enum(['offline', 'online', 'onlining', 'reinforced', 'unanchoring']),
  fuels: z
    .array(
      z.looseObject({
        type_id: z.number(),
        quantity: z.number(),
      }),
    )
    .optional(),
  allow_alliance_members: z.boolean().optional(),
  allow_corporation_members: z.boolean().optional(),
  anchor: z.string().optional(),
  attack_if_at_war: z.boolean().optional(),
  attack_if_other_security_status_dropping: z.boolean().optional(),
  attack_security_status_threshold: z.number().optional(),
  fuel_bay_take: z.string().optional(),
  fuel_bay_view: z.string().optional(),
  offline: z.string().optional(),
  online: z.string().optional(),
  unanchor: z.string().optional(),
  use_alliance_standings: z.boolean().optional(),
});

export const CorporationStructureSchema = z.looseObject({
  structure_id: z.number(),
  corporation_id: z.number(),
  type_id: z.number(),
  system_id: z.number(),
  profile_id: z.number(),
  services: z
    .array(
      z.looseObject({
        name: z.string(),
        state: z.enum(['online', 'offline', 'cleanup']),
      }),
    )
    .optional(),
  fuel_expires: z.string().optional(),
  state: z.string(),
  state_timer_start: z.string().optional(),
  state_timer_end: z.string().optional(),
  unanchors_at: z.string().optional(),
  reinforce_hour: z.number().optional(),
  next_reinforce_apply: z.string().optional(),
});

export const CorporationTitleSchema = z.looseObject({
  title_id: z.number(),
  name: z.string().optional(),
  roles: z.array(z.string()).optional(),
  grantable_roles: z.array(z.string()).optional(),
  roles_at_hq: z.array(z.string()).optional(),
  grantable_roles_at_hq: z.array(z.string()).optional(),
  roles_at_base: z.array(z.string()).optional(),
  grantable_roles_at_base: z.array(z.string()).optional(),
  roles_at_other: z.array(z.string()).optional(),
  grantable_roles_at_other: z.array(z.string()).optional(),
});

export const ContainerLogSchema = z.looseObject({
  logged_at: z.string(),
  container_id: z.number(),
  container_type_id: z.number(),
  character_id: z.number(),
  location_id: z.number(),
  location_flag: z.string(),
  action: z.string(),
  password_type: z.enum(['config', 'general']).optional(),
  type_id: z.number().optional(),
  quantity: z.number().optional(),
  old_config_bitmask: z.number().optional(),
  new_config_bitmask: z.number().optional(),
});
