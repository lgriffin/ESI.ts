export interface FleetInfo {
  fleet_id?: number;
  fleet_boss_id?: number;
  is_free_move: boolean;
  is_registered: boolean;
  is_voice_enabled: boolean;
  motd: string;
}

export interface FleetMember {
  character_id: number;
  ship_type_id: number;
  wing_id: number;
  squad_id: number;
  role:
    | 'fleet_commander'
    | 'wing_commander'
    | 'squad_commander'
    | 'squad_member';
  role_name: string;
  join_time: string;
  takes_fleet_warp: boolean;
  solar_system_id: number;
  station_id?: number;
}

export interface FleetWing {
  id: number;
  name: string;
  squads: { id: number; name: string }[];
}

export interface CharacterFleetInfo {
  fleet_id: number;
  role:
    | 'fleet_commander'
    | 'wing_commander'
    | 'squad_commander'
    | 'squad_member';
  squad_id: number;
  wing_id: number;
}
