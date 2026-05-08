export interface Incursion {
  type: string;
  state: 'withdrawing' | 'mobilizing' | 'established';
  staging_solar_system_id: number;
  constellation_id: number;
  infested_solar_systems: number[];
  has_boss: boolean;
  faction_id: number;
  influence: number;
}
