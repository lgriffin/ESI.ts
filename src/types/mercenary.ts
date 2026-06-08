export interface MercenaryDen {
  den_id: number;
  system_id: number;
  constellation_id: number;
  region_id: number;
  development_level?: number;
  anarchy_level?: number;
  active_operations?: number;
}

export interface MercenaryTacticalOperation {
  operation_id: number;
  den_id: number;
  system_id: number;
  site_type: string;
  status: 'spawning' | 'active' | 'completed' | 'expired';
  started_at?: string;
  expires_at?: string;
}
