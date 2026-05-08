export interface CloneInfo {
  home_location?: {
    location_id: number;
    location_type: 'station' | 'structure';
  };
  jump_clones: {
    jump_clone_id: number;
    location_id: number;
    location_type: 'station' | 'structure';
    implants: number[];
    name?: string;
  }[];
  last_clone_jump_date?: string;
  last_station_change_date?: string;
}
