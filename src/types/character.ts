export interface CharacterInfo {
  character_id: number;
  name: string;
  description?: string;
  corporation_id: number;
  alliance_id?: number;
  ancestry_id?: number;
  bloodline_id: number;
  race_id: number;
  gender: 'male' | 'female';
  security_status?: number;
  title?: string;
  birthday: string;
}

export interface CharacterPortrait {
  px64x64?: string;
  px128x128?: string;
  px256x256?: string;
  px512x512?: string;
}

export interface CharacterAttributes {
  charisma: number;
  intelligence: number;
  memory: number;
  perception: number;
  willpower: number;
  bonus_remaps?: number;
  last_remap_date?: string;
  accrued_remap_cooldown_date?: string;
}

export interface AgentResearch {
  agent_id: number;
  skill_type_id: number;
  started_at: string;
  points_per_day: number;
  remainder_points: number;
}

export interface Blueprint {
  item_id: number;
  type_id: number;
  location_id: number;
  location_flag: string;
  quantity: number;
  time_efficiency: number;
  material_efficiency: number;
  runs: number;
}

export interface CorporationHistory {
  corporation_id: number;
  record_id: number;
  start_date: string;
  is_deleted?: boolean;
}

export interface JumpFatigue {
  jump_fatigue_expire_date?: string;
  last_jump_date?: string;
  last_update_date?: string;
}

export interface Medal {
  medal_id: number;
  title: string;
  description: string;
  date: string;
  issuer_id: number;
  corporation_id: number;
  reason: string;
  status: 'private' | 'public';
  graphics: { part: number; layer: number; graphic: string; color?: number }[];
}

export interface Notification {
  notification_id: number;
  type: string;
  sender_id: number;
  sender_type: 'character' | 'corporation' | 'alliance' | 'faction' | 'other';
  timestamp: string;
  text?: string;
  is_read?: boolean;
}

export interface Standing {
  from_id: number;
  from_type: 'agent' | 'npc_corp' | 'faction';
  standing: number;
}

export interface CharacterTitle {
  title_id: number;
  name: string;
}

export interface CharacterAffiliation {
  character_id: number;
  corporation_id: number;
  alliance_id?: number;
  faction_id?: number;
}

export interface CharacterRole {
  roles?: string[];
  roles_at_hq?: string[];
  roles_at_base?: string[];
  roles_at_other?: string[];
}
