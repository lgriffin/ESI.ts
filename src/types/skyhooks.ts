export interface SovereigntyHub {
  structure_id: number;
  system_id: number;
  corporation_id: number;
  alliance_id?: number;
  online: boolean;
  remaining_reagents?: number;
  installed_upgrades?: number[];
}

export interface OrbitalSkyhook {
  structure_id: number;
  system_id: number;
  corporation_id: number;
  alliance_id?: number;
  online: boolean;
  reagent_silo_capacity?: number;
  reagent_silo_level?: number;
}

export interface RaidableSkyhook {
  structure_id: number;
  system_id: number;
  corporation_id: number;
  alliance_id?: number;
  raidable_at?: string;
  is_raidable: boolean;
}
