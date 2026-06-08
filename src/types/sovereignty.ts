export interface SovereigntyCampaign {
  campaign_id: number;
  structure_id: number;
  solar_system_id: number;
  constellation_id: number;
  event_type:
    | 'tcu_defense'
    | 'ihub_defense'
    | 'station_defense'
    | 'station_freeport';
  start_time: string;
  defender_id?: number;
  defender_score?: number;
  attackers_score?: number;
  participants?: { alliance_id: number; score: number }[];
}

export interface SovereigntyMap {
  system_id: number;
  alliance_id?: number;
  corporation_id?: number;
  faction_id?: number;
}

export interface SovereigntyStructure {
  alliance_id: number;
  solar_system_id: number;
  structure_id: number;
  structure_type_id: number;
  vulnerability_occupancy_level?: number;
  vulnerable_start_time?: string;
  vulnerable_end_time?: string;
}

export interface SovereigntySystemStructure {
  structure_id: number;
  structure_type_id: number;
  vulnerability_occupancy_level?: number;
  vulnerable_start_time?: string;
  vulnerable_end_time?: string;
}

export interface SovereigntySystem {
  system_id: number;
  alliance_id?: number;
  corporation_id?: number;
  faction_id?: number;
  military_index?: number;
  industry_index?: number;
  strategic_index?: number;
  structures?: SovereigntySystemStructure[];
}
