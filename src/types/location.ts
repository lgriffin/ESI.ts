export interface CharacterLocation {
  solar_system_id: number;
  station_id?: number;
  structure_id?: number;
}

export interface CharacterOnline {
  online: boolean;
  last_login?: string;
  last_logout?: string;
  logins?: number;
}

export interface CharacterShip {
  ship_item_id: number;
  ship_name: string;
  ship_type_id: number;
}
