export interface CorporationInfo {
  corporation_id: number;
  name: string;
  ticker: string;
  description?: string;
  url?: string;
  alliance_id?: number;
  ceo_id: number;
  creator_id: number;
  date_founded?: string;
  faction_id?: number;
  home_station_id?: number;
  member_count: number;
  shares?: number;
  tax_rate: number;
  war_eligible?: boolean;
}

export interface CorporationAllianceHistory {
  alliance_id?: number;
  is_deleted?: boolean;
  record_id: number;
  start_date: string;
}

export interface CorporationMedal {
  medal_id: number;
  title: string;
  description: string;
  creator_id: number;
  date: string;
}

export interface CorporationStarbase {
  starbase_id: number;
  type_id: number;
  system_id: number;
  state: 'offline' | 'online' | 'onlining' | 'reinforced' | 'unanchoring';
  moon_id?: number;
  onlined_since?: string;
  reinforced_until?: string;
  unanchor_at?: string;
}

export interface CorporationDivisions {
  hangar?: { division: number; name?: string }[];
  wallet?: { division: number; name?: string }[];
}

export interface CorporationFacility {
  facility_id: number;
  type_id: number;
  system_id: number;
}

export interface CorporationIssuedMedal {
  medal_id: number;
  title: string;
  description: string;
  character_id: number;
  issued_at: string;
  issuer_id: number;
  reason: string;
  status: 'private' | 'public';
}

export interface CorporationMemberTitle {
  character_id: number;
  titles: number[];
}

export interface CorporationMemberTracking {
  character_id: number;
  start_date: string;
  base_id?: number;
  location_id?: number;
  logoff_date?: string;
  logon_date?: string;
  online?: boolean;
  ship_type_id?: number;
}

export interface CorporationMemberRole {
  character_id: number;
  roles?: string[];
  grantable_roles?: string[];
  roles_at_hq?: string[];
  grantable_roles_at_hq?: string[];
  roles_at_base?: string[];
  grantable_roles_at_base?: string[];
  roles_at_other?: string[];
  grantable_roles_at_other?: string[];
}

export interface CorporationRoleHistory {
  character_id: number;
  changed_at: string;
  issuer_id: number;
  role_type: string;
  before: string[];
  after: string[];
}

export interface CorporationShareholder {
  shareholder_id: number;
  shareholder_type: 'character' | 'corporation';
  share_count: number;
}

export interface CorporationStarbaseDetail {
  state: 'offline' | 'online' | 'onlining' | 'reinforced' | 'unanchoring';
  fuels?: { type_id: number; quantity: number }[];
  allow_alliance_members?: boolean;
  allow_corporation_members?: boolean;
  anchor?: string;
  attack_if_at_war?: boolean;
  attack_if_other_security_status_dropping?: boolean;
  attack_security_status_threshold?: number;
  fuel_bay_take?: string;
  fuel_bay_view?: string;
  offline?: string;
  online?: string;
  unanchor?: string;
  use_alliance_standings?: boolean;
}

export interface CorporationStructure {
  structure_id: number;
  corporation_id: number;
  type_id: number;
  system_id: number;
  profile_id: number;
  services?: { name: string; state: 'online' | 'offline' | 'cleanup' }[];
  fuel_expires?: string;
  state: string;
  state_timer_start?: string;
  state_timer_end?: string;
  unanchors_at?: string;
  reinforce_hour?: number;
  next_reinforce_apply?: string;
}

export interface CorporationTitle {
  title_id: number;
  name?: string;
  roles?: string[];
  grantable_roles?: string[];
  roles_at_hq?: string[];
  grantable_roles_at_hq?: string[];
  roles_at_base?: string[];
  grantable_roles_at_base?: string[];
  roles_at_other?: string[];
  grantable_roles_at_other?: string[];
}

export interface ContainerLog {
  logged_at: string;
  container_id: number;
  container_type_id: number;
  character_id: number;
  location_id: number;
  location_flag: string;
  action: string;
  password_type?: 'config' | 'general';
  type_id?: number;
  quantity?: number;
  old_config_bitmask?: number;
  new_config_bitmask?: number;
}
