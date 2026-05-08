export interface PlanetaryColony {
  solar_system_id: number;
  planet_id: number;
  planet_type:
    | 'temperate'
    | 'barren'
    | 'oceanic'
    | 'ice'
    | 'gas'
    | 'lava'
    | 'storm'
    | 'plasma';
  owner_id: number;
  last_update: string;
  upgrade_level: number;
  num_pins: number;
}

export interface CustomsOffice {
  office_id: number;
  system_id: number;
  reinforce_exit_start: number;
  reinforce_exit_end: number;
  alliance_tax_rate?: number;
  corporation_tax_rate?: number;
  standing_level?: string;
  terrible_standing_tax_rate?: number;
  bad_standing_tax_rate?: number;
  neutral_standing_tax_rate?: number;
  good_standing_tax_rate?: number;
  excellent_standing_tax_rate?: number;
}

export interface ColonyLayout {
  links: {
    source_pin_id: number;
    destination_pin_id: number;
    link_level: number;
  }[];
  pins: {
    pin_id: number;
    type_id: number;
    latitude: number;
    longitude: number;
    schematic_id?: number;
    extractor_details?: {
      heads: { head_id: number; latitude: number; longitude: number }[];
      product_type_id?: number;
      cycle_time?: number;
      head_radius?: number;
      qty_per_cycle?: number;
    };
    factory_details?: { schematic_id: number };
    contents?: { type_id: number; amount: number }[];
    install_time?: string;
    expiry_time?: string;
    last_cycle_start?: string;
  }[];
  routes: {
    route_id: number;
    source_pin_id: number;
    destination_pin_id: number;
    content_type_id: number;
    quantity: number;
    waypoints?: number[];
  }[];
}
