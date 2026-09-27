import { z } from 'zod';
import { esiEnum } from './esiEnum';

/**
 * `GET /corporations/{corporation_id}`. ESI changed this response at
 * compatibility date 2026-08-18: `tax_rate` became `tax_rates`, `faction_id`
 * became `enlisted_faction_id`, `ceo_id` and `creator_id` became optional, and
 * `state`, `type`, `friendly_fire` and `palette` were added. A client can pin
 * either date, so the fields that exist at only one of them are optional.
 */
export const CorporationInfoSchema = z.looseObject({
  corporation_id: z.number().optional(),
  name: z.string(),
  ticker: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  alliance_id: z.number().optional(),
  ceo_id: z.number().optional(),
  creator_id: z.number().optional(),
  date_founded: z.string().optional(),
  /** Before 2026-08-18. */
  faction_id: z.number().optional(),
  /** From 2026-08-18. */
  enlisted_faction_id: z.number().optional(),
  home_station_id: z.number().optional(),
  member_count: z.number(),
  shares: z.number().optional(),
  /** Before 2026-08-18. */
  tax_rate: z.number().optional(),
  /** From 2026-08-18. */
  tax_rates: z
    .looseObject({
      isk: z.number(),
      loyalty_point: z.number(),
    })
    .optional(),
  war_eligible: z.boolean().optional(),
  /** From 2026-08-18. */
  friendly_fire: esiEnum(['legal', 'illegal']).optional(),
  /** From 2026-08-18. */
  state: esiEnum(['active', 'closed']).optional(),
  /** From 2026-08-18. */
  type: esiEnum(['player_owned', 'npc_owned']).optional(),
  /** From 2026-08-18. */
  palette: z
    .looseObject({
      main_color: z.string(),
      secondary_color: z.string().optional(),
      tertiary_color: z.string().optional(),
    })
    .optional(),
});

export const CorporationAllianceHistorySchema = z.looseObject({
  alliance_id: z.number().optional(),
  is_deleted: z.boolean().optional(),
  record_id: z.number(),
  start_date: z.string(),
});

/** A medal design, from `GET /corporations/{corporation_id}/medals`. */
export const CorporationMedalSchema = z.looseObject({
  medal_id: z.number(),
  title: z.string(),
  description: z.string(),
  creator_id: z.number(),
  created_at: z.string(),
});

export const CorporationStarbaseSchema = z.looseObject({
  starbase_id: z.number(),
  type_id: z.number(),
  system_id: z.number(),
  state: esiEnum([
    'offline',
    'online',
    'onlining',
    'reinforced',
    'unanchoring',
  ]).optional(),
  moon_id: z.number().optional(),
  onlined_since: z.string().optional(),
  reinforced_until: z.string().optional(),
  unanchor_at: z.string().optional(),
});

export const CorporationDivisionsSchema = z.looseObject({
  hangar: z
    .array(
      z.looseObject({
        division: z.number().optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  wallet: z
    .array(
      z.looseObject({
        division: z.number().optional(),
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

/**
 * A medal awarded to a member, from
 * `GET /corporations/{corporation_id}/medals/issued`. ESI sends no title or
 * description: join on medal_id to the medal list for those.
 */
export const CorporationIssuedMedalSchema = z.looseObject({
  medal_id: z.number(),
  character_id: z.number(),
  issued_at: z.string(),
  issuer_id: z.number(),
  reason: z.string(),
  status: esiEnum(['private', 'public']),
});

export const CorporationMemberTitleSchema = z.looseObject({
  character_id: z.number(),
  titles: z.array(z.number()),
});

export const CorporationMemberTrackingSchema = z.looseObject({
  character_id: z.number(),
  start_date: z.string().optional(),
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

/**
 * One role change, from `GET /corporations/{corporation_id}/roles/history`:
 * the member's full role set of `role_type` before and after the change.
 */
export const CorporationRoleHistorySchema = z.looseObject({
  character_id: z.number(),
  changed_at: z.string(),
  issuer_id: z.number(),
  role_type: z.string(),
  old_roles: z.array(z.string()),
  new_roles: z.array(z.string()),
});

export const CorporationShareholderSchema = z.looseObject({
  shareholder_id: z.number(),
  shareholder_type: esiEnum(['character', 'corporation']),
  share_count: z.number(),
});

/**
 * A control tower's configuration, from
 * `GET /corporations/{corporation_id}/starbases/{starbase_id}`. ESI sends no
 * state here; it is on the starbase list.
 */
export const CorporationStarbaseDetailSchema = z.looseObject({
  fuels: z
    .array(
      z.looseObject({
        type_id: z.number(),
        quantity: z.number(),
      }),
    )
    .optional(),
  allow_alliance_members: z.boolean(),
  allow_corporation_members: z.boolean(),
  anchor: z.string(),
  attack_if_at_war: z.boolean(),
  attack_if_other_security_status_dropping: z.boolean(),
  attack_security_status_threshold: z.number().optional(),
  attack_standing_threshold: z.number().optional(),
  fuel_bay_take: z.string(),
  fuel_bay_view: z.string(),
  offline: z.string(),
  online: z.string(),
  unanchor: z.string(),
  use_alliance_standings: z.boolean(),
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
        state: esiEnum(['online', 'offline', 'cleanup']),
      }),
    )
    .optional(),
  fuel_expires: z.string().optional(),
  name: z.string().optional(),
  state: z.string(),
  state_timer_start: z.string().optional(),
  state_timer_end: z.string().optional(),
  unanchors_at: z.string().optional(),
  reinforce_hour: z.number().optional(),
  next_reinforce_hour: z.number().optional(),
  next_reinforce_apply: z.string().optional(),
});

export const CorporationTitleSchema = z.looseObject({
  title_id: z.number().optional(),
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

export const CorporationIconSchema = z.looseObject({
  px64x64: z.string().optional(),
  px128x128: z.string().optional(),
  px256x256: z.string().optional(),
});

export { StandingSchema as CorporationStandingSchema } from './common';

export const CorporationWalletDivisionSchema = z.looseObject({
  division: z.number(),
  balance: z.number(),
});

export const ContainerLogSchema = z.looseObject({
  logged_at: z.string(),
  container_id: z.number(),
  container_type_id: z.number(),
  character_id: z.number(),
  location_id: z.number(),
  location_flag: z.string(),
  action: z.string(),
  password_type: esiEnum(['config', 'general']).optional(),
  type_id: z.number().optional(),
  quantity: z.number().optional(),
  old_config_bitmask: z.number().optional(),
  new_config_bitmask: z.number().optional(),
});
