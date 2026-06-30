export interface IndustryJob {
  job_id: number;
  installer_id: number;
  facility_id: number;
  station_id: number;
  activity_id: number;
  blueprint_id: number;
  blueprint_type_id: number;
  blueprint_location_id: number;
  output_location_id: number;
  runs: number;
  cost?: number;
  licensed_runs?: number;
  probability?: number;
  product_type_id?: number;
  status:
    'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';
  duration: number;
  start_date: string;
  end_date: string;
  pause_date?: string;
  completed_date?: string;
  completed_character_id?: number;
  successful_runs?: number;
}

export interface MiningLedgerEntry {
  date: string;
  solar_system_id: number;
  type_id: number;
  quantity: number;
}

export interface IndustryFacility {
  facility_id: number;
  owner_id: number;
  region_id: number;
  solar_system_id: number;
  tax?: number;
  type_id: number;
}

export interface IndustrySystem {
  solar_system_id: number;
  cost_indices: {
    activity: string;
    cost_index: number;
  }[];
}

export interface MoonExtractionTimer {
  structure_id: number;
  moon_id: number;
  extraction_start_time: string;
  chunk_arrival_time: string;
  natural_decay_time: string;
}

export interface MiningObserver {
  observer_id: number;
  observer_type: string;
  last_updated: string;
}

export interface MiningObserverEntry {
  character_id: number;
  recorded_corporation_id: number;
  type_id: number;
  quantity: number;
  last_updated: string;
}
